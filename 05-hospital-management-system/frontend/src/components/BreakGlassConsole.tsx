'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Unlock, CheckCircle2 } from 'lucide-react';

interface BreakGlassLog {
  id: string;
  timestamp: string;
  clinicianName: string;
  clinicianRole: string;
  patientName: string;
  mrn: string;
  justificationReason: string;
  durationHours: number;
}

const INITIAL_LOGS: BreakGlassLog[] = [
  {
    id: 'bg_1',
    timestamp: '2026-11-21 13:40 EST',
    clinicianName: 'Dr. Helena Rios, MD (Dermatology)',
    clinicianRole: 'UNASSIGNED CONSULTANT',
    patientName: 'Eleanor Rigby',
    mrn: 'MRN-10023-4',
    justificationReason: 'Emergency code blue called in ICU; covering physician performing urgent airway intervention.',
    durationHours: 4
  }
];

export const BreakGlassConsole: React.FC = () => {
  const [logs, setLogs] = useState<BreakGlassLog[]>(INITIAL_LOGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleDeclareBreakGlass = () => {
    if (!justification || justification.trim().length < 15) {
      alert('Break-glass emergency declaration requires a detailed justification of at least 15 characters.');
      return;
    }

    const newLog: BreakGlassLog = {
      id: `bg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      clinicianName: 'Dr. Helena Rios, MD (Dermatology)',
      clinicianRole: 'EMERGENCY OVERRIDE',
      patientName: 'Arthur Pendelton',
      mrn: 'MRN-20045-8',
      justificationReason: justification.trim(),
      durationHours: 4
    };

    setLogs([newLog, ...logs]);
    setIsModalOpen(false);
    setJustification('');
    setNotice('Emergency break-glass access unlocked for 4 hours. High-priority audit record generated.');
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">Emergency "Break-Glass" Access & Compliance</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statutory relationship-based override protocol. Allows unassigned clinicians emergency access with mandatory audit tracking.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Unlock className="w-4 h-4" /> Declare Emergency Break-Glass
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Compliance Log Table */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
          Perpetual Emergency Override Audit Trail (Hospital Compliance Officer Review)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Clinician & Role</th>
                <th className="py-2.5 px-3">Subject Patient & MRN</th>
                <th className="py-2.5 px-3">Justification Reason</th>
                <th className="py-2.5 px-3 text-right">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{log.clinicianName}</div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {log.clinicianRole}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{log.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.mrn}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs text-slate-600 italic">
                    "{log.justificationReason}"
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                    {log.durationHours} hours
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="font-extrabold text-base">Emergency Break-Glass Declaration</h4>
            </div>

            <p className="text-slate-600 leading-relaxed">
              You are requesting override access to an inpatient chart for a patient not assigned to your service. This action is permanently audited and reviewed by institutional compliance officers.
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Clinical Justification Reason (Minimum 15 characters)
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                placeholder="State clinical emergency (e.g. Code Blue resuscitation coverage, critical airway management)..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-[11px]">
              Access will expire automatically in 4 hours. An urgent alert will be dispatched to the Chief Medical Officer.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclareBreakGlass}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
              >
                Confirm Break-Glass Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
