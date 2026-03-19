-- This file contains the SQL commands to create the missing tables and columns in your Supabase database.
-- Please copy and paste these commands into the SQL Editor in your Supabase dashboard and click "Run".

-- 1. Add missing columns to the 'users' table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdraw NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0;

-- 2. Create the 'task_categories' table
CREATE TABLE IF NOT EXISTS public.task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for task_categories
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for task_categories
CREATE POLICY "Allow public read access to task_categories" ON public.task_categories FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to task_categories" ON public.task_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- 3. Add 'category_id' and 'status' to the 'tasks' table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Ensure other tables exist (just in case)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL,
    task_name TEXT NOT NULL,
    description TEXT,
    reward_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    instructions TEXT,
    video_url TEXT,
    ad_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    proof_url TEXT,
    amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 0,
    method TEXT NOT NULL,
    account_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Allow users to read their own notifications" ON public.notifications FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Allow admin full access to notifications" ON public.notifications FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Insert default values
INSERT INTO public.settings (setting_key, setting_value)
VALUES 
    ('referral_commission', '10'),
    ('pkr_exchange_rate', '278')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to settings" ON public.settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
