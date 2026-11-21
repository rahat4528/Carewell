import React from 'react';
import { Pill, Boxes, FileText, ShoppingCart, ShieldAlert, UserCheck } from 'lucide-react';

interface PharmacyNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'PHARMACIST' | 'PHARMACY_TECH' | 'ADMIN';
  setUserRole: (role: 'PHARMACIST' | 'PHARMACY_TECH' | 'ADMIN') => void;
}

export const PharmacyNavbar: React.FC<PharmacyNavbarProps> = ({
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
            <div className="p-2 bg-emerald-600 text-white rounded-xl font-black shadow-md shadow-emerald-900/40">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Carewell</span>
              <span className="text-emerald-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">Dispensary & POS</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" /> FEFO Inventory
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'prescriptions' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" /> Prescription Queue
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pos' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Point of Sale
            </button>
            <button
              onClick={() => setActiveTab('controlled')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'controlled' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> DEA Perpetual Register
            </button>
          </nav>

          {/* Role Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <span className="text-slate-400 px-1 text-[11px]">Staff Role:</span>
            {(['PHARMACIST', 'PHARMACY_TECH', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2 py-1 rounded transition-colors ${
                  userRole === r ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === 'PHARMACY_TECH' ? 'TECH' : r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
