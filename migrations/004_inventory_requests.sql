-- Inventory requests table for agents to request more stock
CREATE TABLE public.inventory_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  agent_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity_requested integer NOT NULL,
  reason text,
  status character varying DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_requests_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_requests_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id),
  CONSTRAINT inventory_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Create index for faster queries
CREATE INDEX idx_inventory_requests_agent_id ON public.inventory_requests(agent_id);
CREATE INDEX idx_inventory_requests_status ON public.inventory_requests(status);
