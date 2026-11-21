import React from 'react';
import { Dumbbell, Activity, Calendar, Award, User, RefreshCw, Download } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unitSystem: 'METRIC' | 'IMPERIAL';
  toggleUnitSystem: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unitSystem,
  toggleUnitSystem,
  onOpenExport
}) => {
  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'exercises', label: 'Exercise Library', icon: Award },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Carewell</span>
              <span className="text-emerald-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">Fitness</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Controls: Unit Toggle & Export */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleUnitSystem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              title="Toggle Metric (kg/cm) and Imperial (lbs/in)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{unitSystem === 'METRIC' ? 'Metric (kg)' : 'Imperial (lbs)'}</span>
            </button>

            <button
              onClick={onOpenExport}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title="Export Personal Data (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center font-bold text-xs text-emerald-300">
                AM
              </div>
              <span className="hidden lg:inline text-xs font-medium text-slate-300">Alex Morgan</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
