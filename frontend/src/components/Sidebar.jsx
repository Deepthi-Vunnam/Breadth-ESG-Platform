import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ClipboardCheck, 
  History, 
  LogOut,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', name: 'Ingestion Portal', icon: UploadCloud },
    { to: '/review', name: 'Review Ledger', icon: ClipboardCheck },
    { to: '/audit', name: 'Audit Timeline', icon: History },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-700/50 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-brand-500/20 p-2 rounded-lg text-brand-400">
          <Leaf className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-wide bg-gradient-to-r from-brand-400 to-emerald-300 bg-clip-text text-transparent">
            Breathe ESG
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            Carbon Ingestion
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600/25 text-brand-300 border-l-2 border-brand-500 shadow-md shadow-brand-950/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center font-bold text-slate-200">
            {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-slate-200 truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </h4>
            <p className="text-xs text-brand-400 font-medium">Analyst</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700/60 hover:border-red-500/40 text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
