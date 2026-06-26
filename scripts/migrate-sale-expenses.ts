/**
 * Migration Script: Create expense records from existing sales with expenses_total
 * * This script reads all sales that have expenses_total > 0 and creates
 * corresponding expense records in the expenses table.
 * * Run with: npx tsx scripts/migrate-sale-expenses.ts
 */

import { adminClient } from '../lib/supabase-admin'

async function migrateSaleExpenses() {
  console.log('🔄 Starting migration: Creating expense records from sales...')
  
  try {
    // Fetch all sales with expenses_total > 0
    const { data: sales, error: salesError } = await adminClient
      .from('sales')
      .select('id, agent_id, expenses_total, sale_date, customer_name, location, created_at')
      .gt('expenses_total', 0)
    
    if (salesError) {
      console.error('❌ Error fetching sales:', salesError)
      return
    }
    
    if (!sales || sales.length === 0) {
      console.log('✅ No sales with expenses found. Nothing to migrate.')
      return
    }
    
    console.log(`📊 Found ${sales.length} sales with expenses`)
    
    // Create expense records
    const expensesToCreate = sales.map(sale => ({
      agent_id: sale.agent_id,
      category: 'other' as const,
      description: `Sale expenses - ${sale.customer_name || 'Customer'} - ${sale.location || 'No location'}`,
      // FIX: Use nullish coalescing (??) to guarantee a number type fallback
      amount: sale.expenses_total ?? 0, 
      date: sale.sale_date || sale.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      receipt_url: null,
    }))
    
    // Insert in batches of 100
    const batchSize = 100
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < expensesToCreate.length; i += batchSize) {
      const batch = expensesToCreate.slice(i, i + batchSize)
      const { data, error } = await adminClient
        .from('expenses')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error)
        errorCount += batch.length
      } else {
        successCount += data?.length || 0
        console.log(`✅ Batch ${i / batchSize + 1}: Created ${data?.length || 0} expense records`)
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successfully created: ${successCount} expense records`)
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} records`)
    }
    console.log('\n🎉 Migration complete!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
migrateSaleExpenses()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })