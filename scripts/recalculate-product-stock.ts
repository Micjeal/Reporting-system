import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file manually
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recalculateProductStock() {
  console.log('📊 Recalculating product stock based on inventory records...\n');

  // Fetch all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, quantity');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    process.exit(1);
  }

  // Fetch all inventory records
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('product_id, quantity_issued');

  if (inventoryError) {
    console.error('Error fetching inventory:', inventoryError);
    process.exit(1);
  }

  // Calculate total issued per product
  const issuedByProduct = new Map<string, number>();
  inventory?.forEach(item => {
    const current = issuedByProduct.get(item.product_id) || 0;
    issuedByProduct.set(item.product_id, current + item.quantity_issued);
  });

  // Display current state and calculate corrections
  console.log('Current State:');
  console.log('─'.repeat(80));
  console.log(sprintf('%-30s | %-12s | %-12s | %-12s', 'Product', 'Current Stock', 'Total Issued', 'Discrepancy'));
  console.log('─'.repeat(80));

  const updates: { id: string; name: string; newStock: number }[] = [];

  for (const product of products || []) {
    const totalIssued = issuedByProduct.get(product.id) || 0;
    const discrepancy = product.quantity - totalIssued;
    
    console.log(sprintf('%-30s | %-12s | %-12s | %-12s', 
      product.name?.substring(0, 28) || 'Unknown',
      product.quantity,
      totalIssued,
      discrepancy >= 0 ? `+${discrepancy}` : discrepancy
    ));

    // Calculate new stock: set to 0 if all has been issued, or keep the discrepancy if positive
    // This assumes the current stock is what's physically available
    const newStock = Math.max(0, discrepancy);
    
    if (newStock !== product.quantity) {
      updates.push({
        id: product.id,
        name: product.name || 'Unknown',
        newStock
      });
    }
  }

  console.log('─'.repeat(80));
  console.log(`\nFound ${updates.length} products that need stock updates.\n`);

  if (updates.length === 0) {
    console.log('✅ All product stocks are already correct.');
    return;
  }

  console.log('Proposed Updates:');
  console.log('─'.repeat(80));
  updates.forEach(update => {
    console.log(`${update.name}: ${update.newStock} units`);
  });
  console.log('─'.repeat(80));

  // Ask for confirmation
  console.log('\n⚠️  This will update product stock to match inventory records.');
  console.log('The new stock will be: current_stock - total_issued\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Do you want to proceed? (yes/no): ', async (answer: string) => {
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Update cancelled.');
      return;
    }

    console.log('\n🔄 Updating product stocks...');

    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ quantity: update.newStock })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Failed to update ${update.name}:`, error);
      } else {
        console.log(`✅ Updated ${update.name} to ${update.newStock} units`);
      }
    }

    console.log('\n✨ Stock recalculation complete!');
  });
}

function sprintf(format: string, ...args: any[]) {
  return format.replace(/%[-+0-9.]*s/g, () => String(args.shift() || ''));
}

recalculateProductStock().catch(console.error);
