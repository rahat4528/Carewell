'use client';

import React, { useState } from 'react';
import { Check, ShoppingBag, Download, FileText, Sparkles } from 'lucide-react';

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
  checked: boolean;
  pantryDeducted: number;
  notes?: string;
}

const INITIAL_GROCERIES: GroceryItem[] = [
  { id: '1', name: 'Chicken breast (organic)', quantity: 900, unit: 'g', aisle: 'MEAT_SEAFOOD', checked: false, pantryDeducted: 0 },
  { id: '2', name: 'Baby spinach', quantity: 150, unit: 'g', aisle: 'PRODUCE', checked: false, pantryDeducted: 100, notes: '100g deducted from refrigerator' },
  { id: '3', name: 'Quinoa (tri-color)', quantity: 50, unit: 'g', aisle: 'PANTRY_BAKING', checked: true, pantryDeducted: 150, notes: '150g deducted from pantry' },
  { id: '4', name: 'Fresh lemon', quantity: 2, unit: 'count', aisle: 'PRODUCE', checked: false, pantryDeducted: 0 },
  { id: '5', name: 'Extra virgin olive oil', quantity: 0, unit: 'ml', aisle: 'PANTRY_BAKING', checked: true, pantryDeducted: 50, notes: 'Fully stocked in pantry' }
];

export const SmartShoppingList: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>(INITIAL_GROCERIES);

  const toggleCheck = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const aisleGroups: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    aisleGroups[item.aisle] = aisleGroups[item.aisle] || [];
    aisleGroups[item.aisle].push(item);
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-stone-900 text-lg">Smart Grocery List</h3>
          </div>
          <p className="text-xs text-stone-500">Grouped by store aisle with automated pantry stock deduction.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-stone-500" /> Export CSV
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-stone-500" /> Printable List
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {Object.entries(aisleGroups).map(([aisle, aisleItems]) => (
          <div key={aisle} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
            <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-2">
              Aisle: {aisle.replace('_', ' & ')}
            </h4>

            <div className="divide-y divide-stone-200/70">
              {aisleItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        item.checked
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'border-stone-300 hover:border-amber-500 bg-white'
                      }`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <span className={`text-xs font-semibold ${item.checked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {item.name}
                      </span>
                      {item.notes && (
                        <p className="text-[10px] text-amber-700 font-medium">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-700">
                      {item.quantity > 0 ? `${item.quantity} ${item.unit}` : 'In Pantry'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
