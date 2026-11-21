import React from 'react';
import { Stethoscope, Calendar, Clock, ShieldCheck, User } from 'lucide-react';

interface PortalNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  setUserRole: (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => void;
}

export const PortalNavbar: React.FC<PortalNavbarProps> = ({
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
            <div className="p-2 bg-sky-500 text-white rounded-xl font-black">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Carewell</span>
              <span className="text-sky-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">Appointments</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> Find Doctors
            </button>
            <button
              onClick={() => setActiveTab('patient-timeline')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'patient-timeline' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" /> My Appointments
            </button>
            <button
              onClick={() => setActiveTab('doctor-schedule')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'doctor-schedule' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" /> Doctor Schedule
            </button>
            <button
              onClick={() => setActiveTab('admin-verify')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin-verify' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </button>
          </nav>

          {/* Role Switcher (Demo Context) */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <span className="text-slate-400 px-1 text-[11px]">Role:</span>
            {(['PATIENT', 'DOCTOR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2 py-1 rounded transition-colors ${
                  userRole === r ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
