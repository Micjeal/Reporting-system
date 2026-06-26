-- Migration: Setup Supabase Storage for expense receipts
-- Fixed: column is "name" not "path" in storage.objects
-- ─── Step 1: Create bucket ───────────────────────────────────────────────────
-- Run this first if bucket does not exist yet
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: Drop existing policies (clean slate) ────────────────────────────
DROP POLICY IF EXISTS "Agents can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can delete any receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;

-- ─── Step 3: RLS policies using correct column "name" ────────────────────────
-- The upload path format is: {agent_id}/{timestamp}.{ext}
-- storage.objects.name holds the full path string, e.g. "abc-123/1716800000000.jpg"
-- We extract the folder (agent_id) with split_part(name, '/', 1)
-- and verify it matches the agent's id in public.agents

-- UPLOAD: agent can only upload into their own folder
CREATE POLICY "Agents can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND split_part(name, '/', 1) = (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid() LIMIT 1
  )
);

-- SELECT: agent can only read files in their own folder
CREATE POLICY "Agents can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND split_part(name, '/', 1) = (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid() LIMIT 1
  )
);

-- UPDATE: agent can only update files in their own folder
CREATE POLICY "Agents can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND split_part(name, '/', 1) = (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  bucket_id = 'receipts'
  AND split_part(name, '/', 1) = (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid() LIMIT 1
  )
);

-- DELETE: agent can only delete files in their own folder
CREATE POLICY "Agents can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND split_part(name, '/', 1) = (
    SELECT id::text FROM public.agents WHERE user_id = auth.uid() LIMIT 1
  )
);

-- SELECT: admins and managers can view ALL receipts across all agents
CREATE POLICY "Admins and managers can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
    AND status = 'active'
  )
);

-- DELETE: admins and managers can delete any receipt (e.g. when rejecting expense)
CREATE POLICY "Admins and managers can delete any receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
    AND status = 'active'
  )
);
