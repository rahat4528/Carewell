'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { ActivityRings } from '@/components/ActivityRings';
import { RestTimer } from '@/components/RestTimer';
import { WorkoutBuilder } from '@/components/WorkoutBuilder';
import { ExerciseLibrary } from '@/components/ExerciseLibrary';
import { ProgressCharts } from '@/components/ProgressCharts';
import { CalendarView } from '@/components/CalendarView';
import { DataExportModal } from '@/components/DataExportModal';
import { Trophy, TrendingUp, Calendar, Flame } from 'lucide-react';

export default function FitnessDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [unitSystem, setUnitSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const toggleUnitSystem = () => {
    setUnitSystem((prev) => (prev === 'METRIC' ? 'IMPERIAL' : 'METRIC'));
  };

  const weightUnit = unitSystem === 'IMPERIAL' ? 'lbs' : 'kg';
  const benchPr = unitSystem === 'IMPERIAL' ? Math.round(100 * 2.20462) : 100;
  const currentWeight = unitSystem === 'IMPERIAL' ? Math.round(76.5 * 2.20462) : 76.5;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unitSystem={unitSystem}
        toggleUnitSystem={toggleUnitSystem}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Medical Disclaimer Banner */}
        <MedicalDisclaimer />

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Workouts Done</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  12 <span className="text-xs font-normal text-emerald-500 font-semibold">+3 this week</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Bench Press PR</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {benchPr} <span className="text-xs font-normal text-slate-500">{weightUnit} (110 1RM est.)</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Est. Calories Burned</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  2,840 <span className="text-xs font-normal text-slate-500">kcal (weekly MET)</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Current Weight</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {currentWeight} <span className="text-xs font-normal text-slate-500">{weightUnit}</span>
                </div>
              </div>
            </div>

            {/* Daily Activity Rings */}
            <ActivityRings
              steps={9100}
              stepGoal={10000}
              activeMinutes={52}
              minuteGoal={60}
              estimatedCalories={410}
              calorieGoal={500}
            />

            {/* Workout Tracker & Rest Timer Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WorkoutBuilder unitSystem={unitSystem} />
              </div>
              <div className="space-y-6">
                <RestTimer />

                {/* Personal Record Showcase */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Personal Records (PRs)</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Barbell Bench Press</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">100 {weightUnit} (3 reps)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Overhead Military Press</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">55 {weightUnit} (6 reps)</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Peak Session Volume</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">4,250 {weightUnit}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Calculated via Epley formula: w * (1 + reps/30). Recomputed automatically.
                  </div>
                </div>
              </div>
            </div>

            {/* Overload & Analytics Charts */}
            <ProgressCharts unitSystem={unitSystem} />
          </div>
        )}

        {/* Tab 2: WORKOUTS */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WorkoutBuilder unitSystem={unitSystem} />
              </div>
              <div>
                <RestTimer />
              </div>
            </div>
            <ProgressCharts unitSystem={unitSystem} />
          </div>
        )}

        {/* Tab 3: EXERCISES */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <ExerciseLibrary />
          </div>
        )}

        {/* Tab 4: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CalendarView />
          </div>
        )}
      </main>

      {/* Export / Privacy Modal */}
      <DataExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Carewell Fitness Tracker - Standalone Healthcare & Wellness Application</p>
        <p className="mt-1">All rights reserved. Designed for personal wellness monitoring.</p>
      </footer>
    </div>
  );
}
