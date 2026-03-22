import { useState, useEffect } from 'react';
import { Save, Shield, Key, Globe, BellRing, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [referralCommission, setReferralCommission] = useState('10');
  const [pkrExchangeRate, setPkrExchangeRate] = useState('280');
  const [appName, setAppName] = useState('Taskvexa');
  const [supportEmail, setSupportEmail] = useState('support@taskvexa.com');
  const [minWithdrawal, setMinWithdrawal] = useState('5.00');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Check if we have a single row with columns (preferred)
        const row1 = data.find(r => r.id === '1') || data[0];
        
        if (row1.min_withdrawal !== undefined) setMinWithdrawal(String(row1.min_withdrawal));
        if (row1.pkr_exchange_rate !== undefined) setPkrExchangeRate(String(row1.pkr_exchange_rate));
        if (row1.referral_commission !== undefined) setReferralCommission(String(row1.referral_commission));
        if (row1.app_name !== undefined) setAppName(row1.app_name);
        if (row1.support_email !== undefined) setSupportEmail(row1.support_email);
        if (row1.supabase_url !== undefined) setSupabaseUrl(row1.supabase_url);
        if (row1.supabase_service_key !== undefined) setSupabaseServiceKey(row1.supabase_service_key);

        // Also handle key-value pairs if they exist (legacy/fallback)
        data.forEach(setting => {
          const key = setting.setting_key || setting.key || setting.name;
          const value = setting.setting_value || setting.value || setting.content;
          
          if (key === 'referral_commission' && row1.referral_commission === undefined) setReferralCommission(value);
          if (key === 'pkr_exchange_rate' && row1.pkr_exchange_rate === undefined) setPkrExchangeRate(value);
          if (key === 'app_name' && row1.app_name === undefined) setAppName(value);
          if (key === 'support_email' && row1.support_email === undefined) setSupportEmail(value);
          if (key === 'min_withdrawal' && row1.min_withdrawal === undefined) setMinWithdrawal(value);
          if (key === 'supabase_url' && row1.supabase_url === undefined) setSupabaseUrl(value);
          if (key === 'supabase_service_key' && row1.supabase_service_key === undefined) setSupabaseServiceKey(value);
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    // 1. Try to update the single row (id='1') with the key as a column name
    const updatePayload: any = {};
    const numericKeys = ['min_withdrawal', 'pkr_exchange_rate', 'referral_commission'];
    updatePayload[key] = numericKeys.includes(key) ? parseFloat(value) : value;

    const { error: columnUpdateError } = await supabase
      .from('settings')
      .update(updatePayload)
      .eq('id', '1');
    
    // If successful, we're done
    if (!columnUpdateError) return;

    // 2. Fallback to key-value approach if column update failed (e.g., column doesn't exist)
    // Try to find if the setting already exists as a row
    const { data: existing } = await supabase
      .from('settings')
      .select('*')
      .or(`setting_key.eq.${key},key.eq.${key},name.eq.${key}`)
      .maybeSingle();

    if (existing) {
      // Update existing row
      const updateObj: any = {};
      if (existing.setting_key) updateObj.setting_value = value;
      else if (existing.key) updateObj.value = value;
      else if (existing.name) updateObj.content = value;
      
      const { error: updateError } = await supabase
        .from('settings')
        .update(updateObj)
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      // Insert new row
      await supabase
        .from('settings')
        .insert([{ setting_key: key, setting_value: value }]);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving API keys...');
    try {
      await saveSetting('supabase_url', supabaseUrl);
      await saveSetting('supabase_service_key', supabaseServiceKey);
      toast.success('API keys saved successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      toast.error('Failed to save API keys: ' + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReferral = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving referral commission...');
    try {
      await saveSetting('referral_commission', referralCommission);
      toast.success('Referral commission updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error saving referral setting:', error);
      toast.error('Failed to update referral commission: ' + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving general settings...');
    try {
      await saveSetting('pkr_exchange_rate', pkrExchangeRate);
      await saveSetting('app_name', appName);
      await saveSetting('support_email', supportEmail);
      await saveSetting('min_withdrawal', minWithdrawal);
      
      toast.success('Settings saved successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error saving general settings:', error);
      toast.error('Failed to save settings: ' + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    const toastId = toast.loading('Updating password...');
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!', { id: toastId });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password: ' + error.message, { id: toastId });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('referral')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'referral' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Referral Program
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'api' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Manage your application's basic configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">App Name</label>
                    <Input 
                      value={appName} 
                      onChange={(e) => setAppName(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
                    <Input 
                      type="email" 
                      value={supportEmail} 
                      onChange={(e) => setSupportEmail(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Minimum Withdrawal Amount ($)</label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={minWithdrawal} 
                      onChange={(e) => setMinWithdrawal(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">USD to PKR Exchange Rate</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={pkrExchangeRate} 
                      onChange={(e) => setPkrExchangeRate(e.target.value)} 
                    />
                    <p className="text-xs text-slate-500">Used to display PKR equivalent amounts across the admin panel.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button className="gap-2" onClick={handleSaveGeneral} disabled={isSaving}>
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'referral' && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Configure the referral commission rates for your users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Referral Commission (%)</label>
                    <Input 
                      type="number" 
                      value={referralCommission} 
                      onChange={(e) => setReferralCommission(e.target.value)} 
                    />
                    <p className="text-xs text-slate-500">Percentage of task earnings given to the referrer.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button className="gap-2" onClick={handleSaveReferral} disabled={isSaving}>
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Commission'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Update your password and security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button className="gap-2" onClick={handleUpdatePassword} disabled={isChangingPassword || !newPassword || !confirmPassword}>
                    <Save className="w-4 h-4" /> {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Manage your Supabase and third-party integration keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supabase URL</label>
                    <Input 
                      type="password" 
                      value={supabaseUrl} 
                      onChange={(e) => setSupabaseUrl(e.target.value)} 
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supabase Service Role Key</label>
                    <Input 
                      type="password" 
                      value={supabaseServiceKey} 
                      onChange={(e) => setSupabaseServiceKey(e.target.value)} 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <p className="text-xs text-slate-500">Required for admin operations bypassing RLS (like changing user passwords).</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button className="gap-2" onClick={handleSaveApiKeys} disabled={isSaving}>
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save API Keys'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
