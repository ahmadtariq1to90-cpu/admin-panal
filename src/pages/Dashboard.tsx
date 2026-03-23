import { Users, CheckSquare, Wallet, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Users', value: '1,284', change: '+12%', icon: Users, color: 'blue' },
          { label: 'Pending Approvals', value: '42', change: '-5%', icon: CheckSquare, color: 'orange' },
          { label: 'Total Withdrawals', value: '$12,450', change: '+18%', icon: Wallet, color: 'green' },
          { label: 'Active Tasks', value: '156', change: '+3%', icon: LayoutDashboard, color: 'purple' },
        ].map((stat, i) => (
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
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">New user registration</p>
                  <p className="text-xs text-slate-500">User user{i}@example.com joined the platform</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
