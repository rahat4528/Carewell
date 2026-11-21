'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const VOLUME_DATA = [
  { date: 'Nov 01', volumeKg: 3200, bench1Rm: 102 },
  { date: 'Nov 05', volumeKg: 3600, bench1Rm: 104 },
  { date: 'Nov 09', volumeKg: 3450, bench1Rm: 105 },
  { date: 'Nov 13', volumeKg: 4100, bench1Rm: 108 },
  { date: 'Nov 17', volumeKg: 3950, bench1Rm: 108 },
  { date: 'Nov 21', volumeKg: 4250, bench1Rm: 110 }
];

export const ProgressCharts: React.FC<{ unitSystem: 'METRIC' | 'IMPERIAL' }> = ({ unitSystem }) => {
  const isImperial = unitSystem === 'IMPERIAL';
  const displayData = VOLUME_DATA.map((d) => ({
    ...d,
    volume: isImperial ? Math.round(d.volumeKg * 2.20462) : d.volumeKg,
    bench1Rm: isImperial ? Math.round(d.bench1Rm * 2.20462) : d.bench1Rm
  }));

  const unitLabel = isImperial ? 'lbs' : 'kg';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Volume Load Progression */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Progressive Overload Volume</h4>
          <p className="text-xs text-slate-500">Total session volume load over time ({unitLabel})</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estimated 1RM Progression */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Bench Press Estimated 1RM</h4>
          <p className="text-xs text-slate-500">Epley Formula: w * (1 + reps/30) ({unitLabel})</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="rmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip />
              <Area type="monotone" dataKey="bench1Rm" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#rmGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
