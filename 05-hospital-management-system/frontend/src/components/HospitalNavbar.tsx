import React from 'react';
import { Building2, BedDouble, UserCheck, Microscope, ShieldAlert, HeartPulse } from 'lucide-react';

interface HospitalNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'DOCTOR' | 'NURSE' | 'PATHOLOGIST' | 'LAB_TECH' | 'ADMIN';
  setUserRole: (role: 'DOCTOR' | 'NURSE' | 'PATHOLOGIST' | 'LAB_TECH' | 'ADMIN') => void;
}

export const HospitalNavbar: React.FC<HospitalNavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 text-white rounded-xl font-black shadow-md shadow-teal-900/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Carewell</span>
              <span className="text-teal-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">Hospital Center</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('beds')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'beds' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BedDouble className="w-4 h-4" /> Bed Board
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chart' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <HeartPulse className="w-4 h-4" /> Inpatient EHR Chart
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'lab' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Microscope className="w-4 h-4" /> Lab 4-Eyes Queue
            </button>
            <button
              onClick={() => setActiveTab('break-glass')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'break-glass' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Emergency Break-Glass
            </button>
          </nav>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <span className="text-slate-400 px-1 text-[11px]">Role:</span>
            {(['DOCTOR', 'NURSE', 'PATHOLOGIST', 'LAB_TECH', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  userRole === r ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === 'PATHOLOGIST' ? 'PATH' : r === 'LAB_TECH' ? 'TECH' : r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
