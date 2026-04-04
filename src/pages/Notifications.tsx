import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Send, Trash2, Loader2, AlertCircle, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  user_id: string | null; // null means broadcast to all
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', user_id: '' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        user_id: newNotification.user_id === '' ? null : newNotification.user_id
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select();

      if (error) throw error;
      setNotifications([data[0], ...notifications]);
      setNewNotification({ title: '', message: '', user_id: '' });
      alert('Notification sent successfully!');
    } catch (err: unknown) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err: unknown) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">Send alerts and updates to your users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Send New Alert
            </h2>
            <form onSubmit={sendNotification} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input 
                  required
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Target User ID (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={newNotification.user_id}
                    onChange={(e) => setNewNotification({ ...newNotification, user_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Leave empty for all users"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Message</label>
                <textarea 
                  required
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                  placeholder="Write your message here..."
                />
              </div>
              <button 
                type="submit"
                disabled={isSending}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Notification
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Recent History
          </h2>

          {loading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500">Loading history...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">No notification history found.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{n.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        n.user_id ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {n.user_id ? 'Direct' : 'Broadcast'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.user_id && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          To: {n.profiles?.full_name || n.user_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
