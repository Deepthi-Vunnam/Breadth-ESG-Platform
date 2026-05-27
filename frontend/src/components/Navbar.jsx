import React from 'react';
import { Building2, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title }) => {
  const { companies, activeCompany, changeActiveCompany } = useAuth();

  return (
    <header className="h-20 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
          {title}
        </h2>
      </div>

      {/* Right side selectors */}
      <div className="flex items-center gap-6">
        {/* Compliance Seal */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Mode Active</span>
        </div>

        {/* Tenant Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium hidden sm:inline">
            Active Tenant:
          </label>
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700/80 transition-colors cursor-pointer text-sm font-medium">
              <Building2 className="w-4 h-4 text-brand-400" />
              <span>{activeCompany?.company_name || 'Select Company'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            
            <select
              value={activeCompany?.id || ''}
              onChange={(e) => {
                const selected = companies.find(c => String(c.id) === e.target.value);
                if (selected) changeActiveCompany(selected);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
