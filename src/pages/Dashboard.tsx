import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckSquare, Wallet, LayoutDashboard, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '0', change: '+0%', icon: Users, color: 'blue' },
    { label: 'Pending Approvals', value: '0', change: '+0%', icon: CheckSquare, color: 'orange' },
    { label: 'Total Withdrawals', value: '$0.00', change: '+0%', icon: Wallet, color: 'green' },
    { label: 'Active Tasks', value: '0', change: '+0%', icon: LayoutDashboard, color: 'purple' },
  ]);
  const [loading, setLoading] = useState(true);

  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
  }, []);

  const fetchRecentUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentUsers(data || []);
    } catch (err) {
      console.error('Error fetching recent users:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch counts from different tables
      const [
        { count: usersCount },
        { count: approvalsCount },
        { data: withdrawalsData },
        { count: tasksCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('amount').eq('status', 'completed'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      const totalWithdrawals = withdrawalsData?.reduce((acc, w) => acc + (w.amount || 0), 0) || 0;

      setStats([
        { label: 'Total Users', value: (usersCount || 0).toLocaleString(), change: '+0%', icon: Users, color: 'blue' },
        { label: 'Pending Approvals', value: (approvalsCount || 0).toString(), change: '+0%', icon: CheckSquare, color: 'orange' },
        { label: 'Total Withdrawals', value: `$${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '+0%', icon: Wallet, color: 'green' },
        { label: 'Active Tasks', value: (tasksCount || 0).toString(), change: '+0%', icon: LayoutDashboard, color: 'purple' },
      ]);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No recent activity</div>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">New user registration</p>
                    <p className="text-xs text-slate-500">{user.full_name || user.email} joined the platform</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
