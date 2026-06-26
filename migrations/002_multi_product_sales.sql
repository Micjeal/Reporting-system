-- Migration: Refactor sales table for multi-product transactions
-- Description: Adds payment_method, sale_date, total_amount to sales table
--              and creates sale_items table for line items

-- Add new transaction-level columns to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_date DATE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- Backfill sale_date from existing date column (if it exists)
UPDATE public.sales SET sale_date = date::DATE WHERE sale_date IS NULL AND date IS NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_agent_sale_date ON public.sales(agent_id, sale_date);

-- Create sale_items table for line items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price > 0),
  line_total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_agent_product ON public.sale_items(product_id, sale_id);

-- Comments
COMMENT ON COLUMN public.sales.payment_method IS 'Payment method: cash, mobile_money, bank';
COMMENT ON COLUMN public.sales.sale_date IS 'Date the sale transaction occurred';
COMMENT ON COLUMN public.sales.total_amount IS 'Sum of all line item totals';
COMMENT ON TABLE public.sale_items IS 'Individual product line items within a sale transaction';
COMMENT ON COLUMN public.sale_items.line_total IS 'Computed: quantity * unit_price';
