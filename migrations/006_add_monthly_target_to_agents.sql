-- Add monthly_target column to agents table
ALTER TABLE public.agents 
ADD COLUMN monthly_target numeric DEFAULT 50000;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
