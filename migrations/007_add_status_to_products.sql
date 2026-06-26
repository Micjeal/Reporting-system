-- Add status column to products table
ALTER TABLE public.products
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add updated_at column if it doesn't exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
