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
      
      // Fetch counts from different tables with individual error handling
      const fetchCount = async (table: string, filter?: { column: string, value: string | number | boolean }) => {
        try {
          let query = supabase.from(table).select('*', { count: 'exact', head: true });
          if (filter) {
            query = query.eq(filter.column, filter.value);
          }
          const { count, error } = await query;
          if (error) {
            console.warn(`Error fetching count for ${table}:`, error.message);
            return 0;
          }
          return count || 0;
        } catch (e) {
          console.error(`Unexpected error for ${table}:`, e);
          return 0;
        }
      };

      const fetchSum = async (table: string, column: string, filter?: { column: string, value: string | number | boolean }) => {
        try {
          let query = supabase.from(table).select(column);
          if (filter) {
            query = query.eq(filter.column, filter.value);
          }
          const { data, error } = await query;
          if (error) {
            console.warn(`Error fetching sum for ${table}:`, error.message);
            return 0;
          }
          return data?.reduce((acc, curr) => acc + (curr[column] || 0), 0) || 0;
        } catch (e) {
          console.error(`Unexpected error for ${table}:`, e);
          return 0;
        }
      };

      const [
        usersCount,
        approvalsCount,
        totalWithdrawals,
        tasksCount
      ] = await Promise.all([
        fetchCount('profiles'),
        fetchCount('approvals', { column: 'status', value: 'pending' }),
        fetchSum('withdrawals', 'amount', { column: 'status', value: 'completed' }),
        fetchCount('tasks', { column: 'status', value: 'active' })
      ]);

      setStats([
        { label: 'Total Users', value: usersCount.toLocaleString(), change: '+12%', icon: Users, color: 'blue' },
        { label: 'Pending Approvals', value: approvalsCount.toString(), change: '+5%', icon: CheckSquare, color: 'orange' },
        { label: 'Total Withdrawals', value: `$${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '+8%', icon: Wallet, color: 'green' },
        { label: 'Active Tasks', value: tasksCount.toString(), change: '+3%', icon: LayoutDashboard, color: 'purple' },
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
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Recent Activity</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest platform events</p>
          </div>
          <button className="text-xs text-blue-600 font-black uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No recent activity found</p>
              <p className="text-xs text-slate-400 mt-1">New users will appear here once they join</p>
            </div>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-black text-lg border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">New user registration</p>
                    <p className="text-xs text-slate-500 font-medium">{user.full_name || user.email} joined the platform</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mt-0.5">
                    {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
