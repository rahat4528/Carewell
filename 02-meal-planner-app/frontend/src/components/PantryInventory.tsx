'use client';

import React from 'react';
import { PackageOpen, AlertCircle, Plus, Calendar } from 'lucide-react';

interface PantryItemDisplay {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: 'PANTRY' | 'REFRIGERATOR' | 'FREEZER';
  expiryDate: string;
  status: 'USE_SOON' | 'FRESH' | 'EXPIRED';
}

const PANTRY_DATA: PantryItemDisplay[] = [
  { id: '1', name: 'Greek Yogurt (Plain)', quantity: 450, unit: 'g', location: 'REFRIGERATOR', expiryDate: '2026-11-23', status: 'USE_SOON' },
  { id: '2', name: 'Organic Spinach', quantity: 100, unit: 'g', location: 'REFRIGERATOR', expiryDate: '2026-11-24', status: 'USE_SOON' },
  { id: '3', name: 'Quinoa Grain', quantity: 500, unit: 'g', location: 'PANTRY', expiryDate: '2027-06-30', status: 'FRESH' },
  { id: '4', name: 'Extra Virgin Olive Oil', quantity: 500, unit: 'ml', location: 'PANTRY', expiryDate: '2027-12-31', status: 'FRESH' }
];

export const PantryInventory: React.FC = () => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-stone-900 text-lg">Pantry Inventory & Shelf-Life</h3>
          </div>
          <p className="text-xs text-stone-500">Track on-hand food reserves, locations, and expiry alerts.</p>
        </div>
        <button className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Use Soon Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs text-amber-900">2 Items Expiring Soon (Within 5 Days)</h4>
          <p className="text-xs text-amber-800 mt-0.5">
            Greek yogurt and organic spinach are approaching their expiration date. Consider scheduling recipes that utilize these ingredients.
          </p>
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {PANTRY_DATA.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between">
            <div>
              <h5 className="font-bold text-sm text-stone-900">{item.name}</h5>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                <span className="font-semibold text-stone-600">Location: {item.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" /> Expires {item.expiryDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                item.status === 'USE_SOON'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
              <span className="text-sm font-mono font-bold text-stone-800">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
