export type InventoryItem = {
  id: string; // Supabase bigint/text-safe
  agent_id: string;
  product_id: string;
  quantity_issued: number;
  date_issued: string;
  created_at?: string;

  agent?: {
    id: string;
    name: string;
    region?: string;
  };

  product?: {
    id: string;
    name: string;
    unit_price?: number;
  };
};