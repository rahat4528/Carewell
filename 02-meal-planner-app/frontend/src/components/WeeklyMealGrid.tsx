'use client';

import React from 'react';
import { Plus, Users, Flame, Clock } from 'lucide-react';

interface MealSlotItem {
  id: string;
  recipeTitle: string;
  servings: number;
  caloriesEst: number;
  timeMinutes: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const SAMPLE_SCHEDULE: Record<string, Record<string, MealSlotItem | null>> = {
  Monday: {
    Breakfast: { id: 'm1', recipeTitle: 'Classic Overnight Oats', servings: 2, caloriesEst: 340, timeMinutes: 10 },
    Lunch: null,
    Dinner: { id: 'm2', recipeTitle: 'Mediterranean Lemon Chicken Bowl', servings: 4, caloriesEst: 520, timeMinutes: 35 },
    Snacks: null
  },
  Tuesday: {
    Breakfast: null,
    Lunch: { id: 'm3', recipeTitle: 'Quinoa & Spinach Salad', servings: 2, caloriesEst: 380, timeMinutes: 15 },
    Dinner: { id: 'm4', recipeTitle: 'Pan-Seared Salmon & Broccoli', servings: 4, caloriesEst: 480, timeMinutes: 25 },
    Snacks: null
  },
  Wednesday: {
    Breakfast: { id: 'm5', recipeTitle: 'Overnight Chia Pudding', servings: 2, caloriesEst: 280, timeMinutes: 10 },
    Lunch: null,
    Dinner: { id: 'm6', recipeTitle: 'Vegetable Lentil Stew', servings: 6, caloriesEst: 410, timeMinutes: 45 },
    Snacks: null
  }
};

export const WeeklyMealGrid: React.FC = () => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h3 className="font-extrabold text-stone-900 text-lg">Weekly Kitchen Schedule</h3>
          <p className="text-xs text-stone-500">Plan breakfast, lunch, dinner, and snacks for the week of Nov 23 - Nov 29.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-3 py-1.5 rounded-lg border border-amber-200">
            Household: Maya's Kitchen
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px] grid grid-cols-4 gap-4">
          {DAYS.slice(0, 4).map((day) => (
            <div key={day} className="bg-stone-50/70 border border-stone-200 rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                <span className="font-extrabold text-sm text-stone-800">{day}</span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                  Nov {23 + DAYS.indexOf(day)}
                </span>
              </div>

              {SLOTS.map((slot) => {
                const meal = SAMPLE_SCHEDULE[day]?.[slot];
                return (
                  <div key={slot} className="bg-white border border-stone-200/80 rounded-lg p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                      <span>{slot}</span>
                    </div>

                    {meal ? (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-xs text-stone-900 leading-tight">{meal.recipeTitle}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3 text-stone-400" /> {meal.servings} serv
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-700">
                            <Flame className="w-3 h-3" /> {meal.caloriesEst} kcal
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-stone-400" /> {meal.timeMinutes}m
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button className="w-full py-2 border border-dashed border-stone-200 hover:border-amber-400 text-stone-400 hover:text-amber-600 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> Add {slot}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
