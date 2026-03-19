import React, { useState, useEffect } from 'react';
import { Send, Users, User as UserIcon, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Try fetching with users table join first
      let { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          user:users(name, first_name, last_name, email)
        `)
        .order('id', { ascending: false })
        .limit(20);

      // If it fails (likely due to missing users table), try with userrrr table
      if (error) {
        const res = await supabase
          .from('notifications')
          .select(`
            *,
            user:userrrr(name, first_name, last_name, email)
          `)
          .order('id', { ascending: false })
          .limit(20);
        
        // If that also fails, just fetch notifications without user data
        if (res.error) {
          const fallbackRes = await supabase
            .from('notifications')
            .select('*')
            .order('id', { ascending: false })
            .limit(20);
          data = fallbackRes.data;
          error = fallbackRes.error;
        } else {
          data = res.data;
          error = null;
        }
      }

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const toastId = toast.loading('Sending notification...');
    try {
      if (targetType === 'specific') {
        // Find user by email or ID
        let targetUserId = userId;
        if (userId.includes('@')) {
          let { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', userId)
            .limit(1)
            .maybeSingle();
            
          if (userError || !userData) {
            const res = await supabase
              .from('userrrr')
              .select('id')
              .eq('email', userId)
              .limit(1)
              .maybeSingle();
            userData = res.data;
            userError = res.error;
          }

          if (userError || !userData) {
            throw new Error('User not found with that email.');
          }
          targetUserId = userData.id;
        }

        const { error } = await supabase.from('notifications').insert({
          user_id: targetUserId,
          title,
          message,
          is_read: false
        });
        if (error) throw error;
        
        toast.success('Notification sent to user successfully!', { id: toastId });
      } else {
        // Send to all users
        // Note: In a production app with many users, this should be done via a backend edge function
        // to avoid timeout and payload limits.
        let { data: users, error: usersError } = await supabase.from('users').select('id');
        if (usersError || !users) {
          const res = await supabase.from('userrrr').select('id');
          users = res.data;
          usersError = res.error;
        }
        if (usersError || !users) throw usersError || new Error('Failed to fetch users');
        
        const notifications = users.map(u => ({
          user_id: u.id,
          title,
          message,
          is_read: false
        }));
        
        // Insert in batches if needed, but for small apps this is fine
        const { error: insertError } = await supabase.from('notifications').insert(notifications);
        if (insertError) throw insertError;
        
        toast.success(`Notification sent to ${users.length} users successfully!`, { id: toastId });
      }

      // Reset form and refresh history
      setTitle('');
      setMessage('');
      setUserId('');
      fetchHistory();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification.', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notification Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <Card className="col-span-1 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-1">
              Push notifications will be sent to users' devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Audience</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      targetType === 'all' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }`}
                  >
                    <Users className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">All Users</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      targetType === 'specific' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }`}
                  >
                    <UserIcon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Specific User</span>
                  </button>
                </div>
              </div>

              {targetType === 'specific' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">User Email or ID</label>
                  <Input 
                    placeholder="user@example.com" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    disabled={sending}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notification Title</label>
                <Input 
                  placeholder="e.g., Special Bonus!" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message Body</label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={sending}>
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">Loading history...</TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">No recent notifications.</TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md truncate">{item.message}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.user ? 'secondary' : 'default'}>
                          {item.user ? `${item.user.name || [item.user.first_name, item.user.last_name].filter(Boolean).join(' ') || ''}`.trim() || item.user.email : 'Unknown User'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
