'use client';

import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ScheduledEvent {
  date: string;
  name: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'SKIPPED';
}

const EVENTS: ScheduledEvent[] = [
  { date: '2026-11-18', name: 'Upper Body Push', status: 'COMPLETED' },
  { date: '2026-11-19', name: 'Cardio & Abs Session', status: 'COMPLETED' },
  { date: '2026-11-20', name: 'Legs & Core Hypertrophy', status: 'MISSED' },
  { date: '2026-11-21', name: 'Pull Day Heavy', status: 'COMPLETED' },
  { date: '2026-11-23', name: 'Full Body Deload', status: 'SCHEDULED' },
  { date: '2026-11-25', name: 'Lower Body Strength', status: 'SCHEDULED' }
];

export const CalendarView: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Workout Training Schedule</h3>
          <p className="text-xs text-slate-500">Track planned, completed, and missed workout sessions with weekly recurrence.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
          <span className="flex items-center gap-1 text-rose-500 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Missed
          </span>
          <span className="flex items-center gap-1 text-blue-500 font-semibold">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENTS.map((evt, idx) => {
          let badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
          let borderClass = 'border-blue-200 dark:border-blue-900';
          let icon = <Clock className="w-4 h-4 text-blue-500" />;

          if (evt.status === 'COMPLETED') {
            badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
            borderClass = 'border-emerald-200 dark:border-emerald-900';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
          } else if (evt.status === 'MISSED') {
            badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
            borderClass = 'border-rose-200 dark:border-rose-900';
            icon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
          }

          return (
            <div key={idx} className={`p-4 rounded-xl border ${borderClass} bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{evt.date}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
                    {evt.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{evt.name}</h4>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">{icon} Recurrence: Weekly</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
