import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {location.pathname === '/' ? 'Dashboard' : 
               location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">
              Admin Control Center
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-black text-slate-900 leading-tight">{user?.email?.split('@')[0]}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Super Admin</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200 border-2 border-white">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
