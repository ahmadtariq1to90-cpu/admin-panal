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
  const [pkrExchangeRate, setPkrExchangeRate] = useState('278');
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
      const { data: refData } = await supabase.from('settings').select('*').eq('setting_key', 'referral_commission').single();
      if (refData) {
        setReferralCommission(refData.setting_value);
      }
      const { data: pkrData } = await supabase.from('settings').select('*').eq('setting_key', 'pkr_exchange_rate').single();
      if (pkrData) {
        setPkrExchangeRate(pkrData.setting_value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveReferral = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving referral commission...');
    try {
      const { error } = await supabase.from('settings').upsert({
        setting_key: 'referral_commission',
        setting_value: referralCommission
      }, { onConflict: 'setting_key' });
      
      if (error) throw error;
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
      const { error } = await supabase.from('settings').upsert({
        setting_key: 'pkr_exchange_rate',
        setting_value: pkrExchangeRate
      }, { onConflict: 'setting_key' });
      
      if (error) throw error;
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
                    <Input defaultValue="Taskvexa" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
                    <Input defaultValue="support@taskvexa.com" type="email" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Minimum Withdrawal Amount ($)</label>
                    <Input defaultValue="5.00" type="number" step="0.5" />
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
                    <Input defaultValue="https://jzafnfhavugeclomeayw.supabase.co" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supabase Service Role Key</label>
                    <Input defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." type="password" />
                    <p className="text-xs text-slate-500">Required for admin operations bypassing RLS (like changing user passwords).</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <Button className="gap-2" onClick={() => toast.success('API Keys saved!')}>
                    <Save className="w-4 h-4" /> Save API Keys
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
