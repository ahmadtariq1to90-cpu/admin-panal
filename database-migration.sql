-- Migration script to add admin panel required columns to existing tables

-- Add missing columns to userrrr
ALTER TABLE public.userrrr ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.userrrr ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.userrrr ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;
ALTER TABLE public.userrrr ADD COLUMN IF NOT EXISTS total_withdraw NUMERIC DEFAULT 0;
ALTER TABLE public.userrrr ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0;

-- Add missing columns to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pkr_exchange_rate NUMERIC DEFAULT 280;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS referral_commission NUMERIC DEFAULT 10;

-- Ensure settings row exists
INSERT INTO public.settings (id, pkr_exchange_rate, referral_commission)
VALUES ('1', 280, 10)
ON CONFLICT (id) DO UPDATE SET
  pkr_exchange_rate = EXCLUDED.pkr_exchange_rate,
  referral_commission = EXCLUDED.referral_commission;
