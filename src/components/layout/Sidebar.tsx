import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  ListTodo,
  ShieldCheck
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/approvals', icon: ShieldCheck, label: 'Approvals' },
    { to: '/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        {isOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
      </button>

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-xl text-slate-900 tracking-tight block">ADMIN</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] -mt-1 block">Control Center</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 translate-x-1" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                  )} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm group active:scale-95"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
