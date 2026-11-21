'use client';

import React, { useState } from 'react';
import { Search, Filter, Dumbbell, Plus } from 'lucide-react';

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  equipment: string;
  instructions: string;
  isCustom?: boolean;
}

const CATALOG_SEED: ExerciseItem[] = [
  { id: '1', name: 'Barbell Bench Press', category: 'STRENGTH', primaryMuscle: 'CHEST', equipment: 'BARBELL', instructions: 'Lower bar with elbows at 45 degrees, touch mid-chest and press up.' },
  { id: '2', name: 'Barbell Back Squat', category: 'STRENGTH', primaryMuscle: 'LEGS_QUADRICEPS', equipment: 'BARBELL', instructions: 'Descend until thighs are parallel to ground, drive through mid-foot.' },
  { id: '3', name: 'Conventional Deadlift', category: 'STRENGTH', primaryMuscle: 'BACK', equipment: 'BARBELL', instructions: 'Hinge hips back, brace core, keep bar close to shins and stand tall.' },
  { id: '4', name: 'Overhead Military Press', category: 'STRENGTH', primaryMuscle: 'SHOULDERS', equipment: 'BARBELL', instructions: 'Press bar vertically overhead from collarbone to lockout.' },
  { id: '5', name: 'Romanian Deadlift', category: 'STRENGTH', primaryMuscle: 'LEGS_HAMSTRINGS', equipment: 'BARBELL', instructions: 'Hinge hips backward with soft knees feeling hamstring stretch.' },
  { id: '6', name: 'Bodyweight Pull-Up', category: 'CALISTHENICS', primaryMuscle: 'BACK', equipment: 'BODYWEIGHT', instructions: 'Pull chest toward bar until chin clears, control descent.' },
  { id: '7', name: 'Cable Chest Fly', category: 'STRENGTH', primaryMuscle: 'CHEST', equipment: 'CABLE', instructions: 'Bring handles together in front of chest maintaining elbow flexion.' },
  { id: '8', name: 'Dumbbell Lateral Raise', category: 'STRENGTH', primaryMuscle: 'SHOULDERS', equipment: 'DUMBBELL', instructions: 'Raise arms out to sides until parallel to floor leading with elbows.' }
];

export const ExerciseLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filtered = CATALOG_SEED.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'ALL' || ex.primaryMuscle === selectedMuscle;
    const matchesCategory = selectedCategory === 'ALL' || ex.category === selectedCategory;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Exercise Catalog</h3>
          <p className="text-xs text-slate-500">Explore standard resistance movements or create custom private exercises.</p>
        </div>
        <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Custom Exercise
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Muscle Groups</option>
          <option value="CHEST">Chest</option>
          <option value="BACK">Back</option>
          <option value="LEGS_QUADRICEPS">Legs (Quads)</option>
          <option value="LEGS_HAMSTRINGS">Legs (Hamstrings)</option>
          <option value="SHOULDERS">Shoulders</option>
          <option value="CORE">Core</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Categories</option>
          <option value="STRENGTH">Strength</option>
          <option value="CALISTHENICS">Calisthenics</option>
          <option value="CARDIO">Cardio</option>
        </select>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((ex) => (
          <div key={ex.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all bg-white dark:bg-slate-950">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ex.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    {ex.primaryMuscle}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ex.equipment}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{ex.instructions}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
