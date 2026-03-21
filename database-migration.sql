-- Migration script to add admin panel required columns to existing tables

-- Add missing columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_withdraw NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0;

-- Add missing columns to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pkr_exchange_rate NUMERIC DEFAULT 280;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS referral_commission NUMERIC DEFAULT 10;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS min_withdrawal NUMERIC DEFAULT 5.00;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'Taskvexa';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@taskvexa.com';

-- Ensure settings row exists
INSERT INTO public.settings (id, pkr_exchange_rate, referral_commission, min_withdrawal, app_name, support_email)
VALUES ('1', 280, 10, 5.00, 'Taskvexa', 'support@taskvexa.com')
ON CONFLICT (id) DO UPDATE SET
  pkr_exchange_rate = EXCLUDED.pkr_exchange_rate,
  referral_commission = EXCLUDED.referral_commission,
  min_withdrawal = EXCLUDED.min_withdrawal,
  app_name = EXCLUDED.app_name,
  support_email = EXCLUDED.support_email;
