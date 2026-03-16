import { useState, useEffect } from 'react';
import { Users, CreditCard, ClipboardCheck, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingWithdrawals: 0,
    pendingApprovals: 0,
    totalPayouts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock chart data for now, as aggregating daily data requires complex SQL or multiple queries
  const chartData = [
    { name: 'Mon', users: 40, tasks: 24 },
    { name: 'Tue', users: 30, tasks: 13 },
    { name: 'Wed', users: 20, tasks: 98 },
    { name: 'Thu', users: 27, tasks: 39 },
    { name: 'Fri', users: 18, tasks: 48 },
    { name: 'Sat', users: 23, tasks: 38 },
    { name: 'Sun', users: 34, tasks: 43 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [usersRes, pendingWithdrawalsRes, pendingApprovalsRes, payoutsRes, recentSubmissionsRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('task_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('amount').eq('status', 'approved'),
        supabase.from('task_submissions').select('*, task:tasks(task_name), user:users(first_name, last_name)').order('id', { ascending: false }).limit(5)
      ]);

      const totalPayouts = payoutsRes.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        pendingWithdrawals: pendingWithdrawalsRes.count || 0,
        pendingApprovals: pendingApprovalsRes.count || 0,
        totalPayouts: totalPayouts,
      });

      // Format recent activity
      const activity = (recentSubmissionsRes.data || []).map((sub: any) => ({
        id: sub.id,
        user: sub.user ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() : 'Unknown User',
        action: 'completed task',
        target: sub.task?.task_name || 'Unknown Task',
        time: new Date(sub.created_at || sub.submitted_at || Date.now()).toLocaleString()
      }));
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Last updated: Just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={loading ? '...' : stats.totalUsers.toLocaleString()} 
          trend="+0%" 
          icon={Users} 
          color="text-indigo-500" 
          bg="bg-indigo-500/10" 
        />
        <StatCard 
          title="Pending Withdrawals" 
          value={loading ? '...' : stats.pendingWithdrawals.toLocaleString()} 
          trend="Needs action" 
          icon={CreditCard} 
          color="text-rose-500" 
          bg="bg-rose-500/10" 
        />
        <StatCard 
          title="Pending Approvals" 
          value={loading ? '...' : stats.pendingApprovals.toLocaleString()} 
          trend="Needs action" 
          icon={ClipboardCheck} 
          color="text-amber-500" 
          bg="bg-amber-500/10" 
        />
        <StatCard 
          title="Total Payouts" 
          value={loading ? '...' : `$${stats.totalPayouts.toFixed(2)}`} 
          trend="+0%" 
          icon={DollarSign} 
          color="text-emerald-500" 
          bg="bg-emerald-500/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.1 }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} name="Active Users" />
                  <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tasks Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <button className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <p className="text-sm text-slate-500">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No recent activity found.</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-xs shrink-0">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-200">
                        <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, bg }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h4 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</h4>
          </div>
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className={`w-4 h-4 mr-1 ${trend.includes('+') ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className={trend.includes('+') ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>{trend}</span>
          <span className="text-slate-500 dark:text-slate-400 ml-2">vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}
