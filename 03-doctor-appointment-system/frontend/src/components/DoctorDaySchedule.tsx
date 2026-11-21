'use client';

import React from 'react';
import { Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';

export const DoctorDaySchedule: React.FC = () => {
  const scheduleSlots = [
    { time: '09:00 AM - 09:30 AM', patient: 'David Miller', reason: 'Preventive cardiology consult', status: 'CONFIRMED' },
    { time: '09:35 AM - 10:05 AM', patient: 'Open Slot', reason: '', status: 'AVAILABLE' },
    { time: '10:10 AM - 10:40 AM', patient: 'Elena Rostova', reason: 'Hypertension follow-up', status: 'CHECKED_IN' },
    { time: '10:45 AM - 11:15 AM', patient: 'Open Slot', reason: '', status: 'AVAILABLE' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Practitioner Daily Schedule</h3>
          <p className="text-xs text-slate-500">Dr. Sarah Jenkins, MD • Carewell Outpatient Pavilion (Mon, Nov 23)</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Add Recurring Block
        </button>
      </div>

      <div className="space-y-3">
        {scheduleSlots.map((s, idx) => (
          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-slate-700">{s.time}</span>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">
                  {s.patient} {s.reason && <span className="text-slate-400 font-normal">• {s.reason}</span>}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              s.status === 'AVAILABLE'
                ? 'bg-emerald-100 text-emerald-800'
                : s.status === 'CHECKED_IN'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-sky-100 text-sky-800'
            }`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
