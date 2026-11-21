'use client';

import React, { useState } from 'react';
import { Clock, Users, Plus, Scale, Sparkles } from 'lucide-react';

interface RecipeCardData {
  id: string;
  title: string;
  cuisine: string;
  prepMinutes: number;
  baseServings: number;
  dietaryTags: string[];
  caloriesPerServing: number;
  ingredientsCount: number;
}

const RECIPES: RecipeCardData[] = [
  {
    id: 'r1',
    title: 'Mediterranean Lemon Herb Chicken Bowl',
    cuisine: 'Mediterranean',
    prepMinutes: 35,
    baseServings: 4,
    dietaryTags: ['HIGH_PROTEIN', 'GLUTEN_FREE'],
    caloriesPerServing: 520,
    ingredientsCount: 5
  },
  {
    id: 'r2',
    title: 'Pan-Seared Wild Salmon & Steamed Broccoli',
    cuisine: 'Nordic',
    prepMinutes: 25,
    baseServings: 2,
    dietaryTags: ['HIGH_OMEGA3', 'KETO_FRIENDLY'],
    caloriesPerServing: 480,
    ingredientsCount: 4
  },
  {
    id: 'r3',
    title: 'Hearty Garden Vegetable Lentil Stew',
    cuisine: 'Plant-Based',
    prepMinutes: 45,
    baseServings: 6,
    dietaryTags: ['VEGAN', 'HIGH_FIBER'],
    caloriesPerServing: 390,
    ingredientsCount: 7
  },
  {
    id: 'r4',
    title: 'Classic Overnight Oats with Berries',
    cuisine: 'Breakfast',
    prepMinutes: 10,
    baseServings: 2,
    dietaryTags: ['WHOLE_GRAIN', 'VEGETARIAN'],
    caloriesPerServing: 340,
    ingredientsCount: 4
  }
];

export const RecipeCardList: React.FC = () => {
  const [selectedServingOverrides, setSelectedServingOverrides] = useState<Record<string, number>>({});

  const setServings = (id: string, count: number) => {
    setSelectedServingOverrides(prev => ({ ...prev, [id]: count }));
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="font-extrabold text-stone-900 text-lg">Household Recipe Collection</h3>
          <p className="text-xs text-stone-500">Curated, customizable recipes with dynamic serving scaling.</p>
        </div>
        <button className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> New Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {RECIPES.map((recipe) => {
          const currentServings = selectedServingOverrides[recipe.id] || recipe.baseServings;
          const scaleMultiplier = currentServings / recipe.baseServings;

          return (
            <div key={recipe.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded text-[10px]">
                    {recipe.cuisine}
                  </span>
                  <div className="flex items-center gap-1 text-stone-500 text-xs">
                    <Clock className="w-3.5 h-3.5" /> {recipe.prepMinutes} mins
                  </div>
                </div>

                <h4 className="font-extrabold text-stone-900 text-base">{recipe.title}</h4>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {recipe.dietaryTags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Serving Scaler */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-stone-600 font-medium">Servings:</span>
                  <select
                    value={currentServings}
                    onChange={(e) => setServings(recipe.id, Number(e.target.value))}
                    className="text-xs font-bold border border-stone-300 rounded px-2 py-1 bg-white"
                  >
                    {[1, 2, 4, 6, 8, 12].map((s) => (
                      <option key={s} value={s}>{s} servings</option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-stone-900">
                    ~{Math.round(recipe.caloriesPerServing * scaleMultiplier)} <span className="text-[10px] text-stone-500 font-normal">kcal total</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">Estimated (FoodData)</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
