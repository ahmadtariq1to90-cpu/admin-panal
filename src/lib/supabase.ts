import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzafnhhavugcelomeayw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWZuZmhhdnVnZWNsb21lYXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDk2MDAsImV4cCI6MjA4ODcyNTYwMH0.xKtk-XSAlGSjZyhaHvfR_7EMNFDvGFJa-OXRyQWU7VI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
