import React from 'react';
import { UtensilsCrossed, Calendar, ShoppingCart, PackageOpen, Download, Globe } from 'lucide-react';

interface KitchenNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenImport: () => void;
}

export const KitchenNavbar: React.FC<KitchenNavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImport
}) => {
  const tabs = [
    { id: 'calendar', label: 'Weekly Plan', icon: Calendar },
    { id: 'recipes', label: 'Recipe Book', icon: UtensilsCrossed },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
    { id: 'pantry', label: 'Pantry & Expiry', icon: PackageOpen },
  ];

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-stone-950 rounded-xl font-black">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">Carewell</span>
              <span className="text-amber-400 text-xs font-semibold ml-1.5 uppercase tracking-wider">Kitchen</span>
            </div>
          </div>

          {/* Navigation Tabs */}
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
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700"
              title="Import recipe from web URL"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Import URL</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
              <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center font-bold text-xs text-amber-300">
                MK
              </div>
              <span className="hidden lg:inline text-xs font-medium text-stone-300">Maya's Kitchen</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
