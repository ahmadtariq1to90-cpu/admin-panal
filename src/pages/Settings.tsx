import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Key, Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('service_role_key')
        .eq('id', 'global')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setServiceRoleKey(data.service_role_key || '');
      }
    } catch (err: unknown) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 'global', 
          service_role_key: serviceRoleKey,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? `Failed to save settings: ${err.message}` : 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Configure your administrative tools and API keys</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Supabase Configuration</h2>
              <p className="text-sm text-slate-500">Manage your Supabase Service Role Key for administrative actions</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p>{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Supabase Service Role Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  placeholder="Enter your service_role key"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-slate-500">
                This key is required to perform administrative actions like deleting users from Supabase Auth. 
                <span className="text-amber-600 font-medium block mt-1">
                  Warning: Never share this key. It bypasses all Row Level Security policies.
                </span>
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-2">
          <h3 className="text-amber-900 font-bold">Why is this key needed?</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Standard Supabase keys (anon/authenticated) cannot delete users from the Authentication system. 
            To fully remove a user so they can re-register with the same email, the Service Role Key is required 
            to communicate with the Supabase Admin API.
          </p>
        </div>
      </div>
    </div>
  );
}
