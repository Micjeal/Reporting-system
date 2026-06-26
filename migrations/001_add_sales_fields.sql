-- Migration: Add new fields to sales table for customer and route information
-- Created: 2024
-- Description: Adds customer details, location, route, banking, and expense tracking fields

-- Add new columns to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bank_details VARCHAR(200);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS expenses_total NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tokens_deducted NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS returns_amount NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_customer_name ON public.sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_route ON public.sales(route);
CREATE INDEX IF NOT EXISTS idx_sales_location ON public.sales(location);

-- Add comments for documentation
COMMENT ON COLUMN public.sales.customer_name IS 'Name of the customer who made the purchase';
COMMENT ON COLUMN public.sales.customer_phone IS 'Customer contact phone number';
COMMENT ON COLUMN public.sales.location IS 'Physical location where the sale took place';
COMMENT ON COLUMN public.sales.route IS 'Sales route or territory identifier';
COMMENT ON COLUMN public.sales.bank_details IS 'Banking information or payment method reference';
COMMENT ON COLUMN public.sales.expenses_total IS 'Total expenses associated with this sale';
COMMENT ON COLUMN public.sales.tokens_deducted IS 'Tokens or discounts deducted from the sale';
COMMENT ON COLUMN public.sales.returns_amount IS 'Amount of returns or refunds';
COMMENT ON COLUMN public.sales.notes IS 'Additional notes about the sale';
