-- Migration: Create user_settings table
-- Description: Adds user_settings table for storing user preferences including theme and notification settings

-- Create trigger function for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notification_preferences JSONB DEFAULT '{
    "email": {
      "salesAlerts": true,
      "inventoryAlerts": true,
      "userApprovals": true,
      "systemUpdates": true
    },
    "push": {
      "salesAlerts": true,
      "inventoryAlerts": true,
      "userApprovals": true
    },
    "inApp": {
      "salesAlerts": true,
      "inventoryAlerts": true,
      "userApprovals": true,
      "systemUpdates": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_settings_user_id_unique UNIQUE(user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Create trigger for automatic updated_at timestamp updates
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE public.user_settings IS 'User preferences and settings including theme and notification preferences';
COMMENT ON COLUMN public.user_settings.theme IS 'UI theme preference: light, dark, or system';
COMMENT ON COLUMN public.user_settings.notification_preferences IS 'JSONB object containing notification preferences for email, push, and in-app channels';
COMMENT ON COLUMN public.user_settings.user_id IS 'Foreign key reference to users table with unique constraint';
