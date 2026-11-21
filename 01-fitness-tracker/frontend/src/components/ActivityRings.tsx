import React from 'react';
import { Flame, Footprints, Clock } from 'lucide-react';

interface ActivityRingsProps {
  steps: number;
  stepGoal: number;
  activeMinutes: number;
  minuteGoal: number;
  estimatedCalories: number;
  calorieGoal: number;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({
  steps = 8450,
  stepGoal = 10000,
  activeMinutes = 48,
  minuteGoal = 60,
  estimatedCalories = 420,
  calorieGoal = 500,
}) => {
  const stepPercent = Math.min(100, Math.round((steps / stepGoal) * 100));
  const minPercent = Math.min(100, Math.round((activeMinutes / minuteGoal) * 100));
  const calPercent = Math.min(100, Math.round((estimatedCalories / calorieGoal) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Daily Activity Status</h3>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">
          Source: Device & Manual
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step Ring */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <div className="p-2.5 bg-emerald-500 text-white rounded-lg">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Steps ({stepPercent}%)
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {steps.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {stepGoal.toLocaleString()}</span>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Measured Pedometer</div>
          </div>
        </div>

        {/* Active Minutes Ring */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <div className="p-2.5 bg-blue-500 text-white rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
              Active Time ({minPercent}%)
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {activeMinutes} <span className="text-xs font-normal text-slate-500">/ {minuteGoal} min</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Session Duration</div>
          </div>
        </div>

        {/* Calorie Ring */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40">
          <div className="p-2.5 bg-orange-500 text-white rounded-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-orange-800 dark:text-orange-400 uppercase tracking-wider">
              Energy ({calPercent}%)
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {estimatedCalories} <span className="text-xs font-normal text-slate-500">/ {calorieGoal} kcal</span>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Estimated (MET Model)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
