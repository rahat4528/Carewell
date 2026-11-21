'use client';

import React, { useState } from 'react';
import { KitchenNavbar } from '@/components/KitchenNavbar';
import { NutritionalDisclaimer } from '@/components/NutritionalDisclaimer';
import { WeeklyMealGrid } from '@/components/WeeklyMealGrid';
import { RecipeCardList } from '@/components/RecipeCardList';
import { SmartShoppingList } from '@/components/SmartShoppingList';
import { PantryInventory } from '@/components/PantryInventory';
import { RecipeImportModal } from '@/components/RecipeImportModal';
import { Utensils, Calendar, ShoppingBag, PackageOpen } from 'lucide-react';

export default function MealPlannerPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      <KitchenNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImport={() => setIsImportOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Nutritional Disclaimer */}
        <NutritionalDisclaimer />

        {/* Quick Kitchen Metric Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Meals Planned</span>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1">
              8 <span className="text-xs font-normal text-stone-500">for week of Nov 23</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Saved Recipes</span>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1">
              14 <span className="text-xs font-normal text-stone-500">in collection</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Grocery Items</span>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1">
              5 <span className="text-xs font-normal text-emerald-600 font-semibold">3 in pantry</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <PackageOpen className="w-4 h-4 text-rose-600" />
              <span>Use Soon Alerts</span>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1 text-amber-700">
              2 <span className="text-xs font-normal text-stone-500">expiring &le; 5 days</span>
            </div>
          </div>
        </div>

        {/* Tab 1: WEEKLY PLAN */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <WeeklyMealGrid />
            <SmartShoppingList />
          </div>
        )}

        {/* Tab 2: RECIPES */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <RecipeCardList />
          </div>
        )}

        {/* Tab 3: SHOPPING */}
        {activeTab === 'shopping' && (
          <div className="space-y-6">
            <SmartShoppingList />
          </div>
        )}

        {/* Tab 4: PANTRY */}
        {activeTab === 'pantry' && (
          <div className="space-y-6">
            <PantryInventory />
          </div>
        )}
      </main>

      <RecipeImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <p>Carewell Meal Planner App - Standalone Culinary Logistics & Nutrition Application</p>
        <p className="mt-1">All rights reserved. Designed for household recipe planning and grocery optimization.</p>
      </footer>
    </div>
  );
}
