'use client';

import React from 'react';
import { ShieldAlert, FileText, CheckCircle2, Lock } from 'lucide-react';

interface ControlledEntry {
  id: string;
  timestamp: string;
  rxNumber: string;
  medication: string;
  schedule: string;
  prescriberDea: string;
  prescriberNpi: string;
  patientIdType: string;
  patientIdHash: string;
  dispensedQty: number;
  priorBalance: number;
  newBalance: number;
  pharmacistLicense: string;
}

const SAMPLE_REGISTER: ControlledEntry[] = [
  {
    id: 'c1',
    timestamp: '2026-11-21 14:32 EST',
    rxNumber: 'RX-9948204',
    medication: 'Ritalin 10mg (Methylphenidate)',
    schedule: 'SCHEDULE_II',
    prescriberDea: 'AB1234563',
    prescriberNpi: '1098765432',
    patientIdType: 'DRIVERS_LICENSE',
    patientIdHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    dispensedQty: 30,
    priorBalance: 150,
    newBalance: 120,
    pharmacistLicense: 'RPH-99201'
  },
  {
    id: 'c2',
    timestamp: '2026-11-20 09:15 EST',
    rxNumber: 'RX-7731049',
    medication: 'Ambien 5mg (Zolpidem)',
    schedule: 'SCHEDULE_IV',
    prescriberDea: 'MJ8829104',
    prescriberNpi: '1987654321',
    patientIdType: 'PASSPORT',
    patientIdHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    dispensedQty: 30,
    priorBalance: 120,
    newBalance: 90,
    pharmacistLicense: 'RPH-99201'
  }
];

export const ControlledSubstanceRegister: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">DEA Perpetual Inventory Register</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statutory perpetual custody log for Schedule II-V controlled pharmaceuticals. Immutable append-only audit trail.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5" />
          <span>DEA Title 21 CFR Part 1304 Compliant</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Date & Rx #</th>
              <th className="py-3 px-3">Medication & Schedule</th>
              <th className="py-3 px-3">Prescriber DEA / NPI</th>
              <th className="py-3 px-3">Patient ID Record</th>
              <th className="py-3 px-3 text-center">Dispensed</th>
              <th className="py-3 px-3 text-center">Perpetual Stock</th>
              <th className="py-3 px-3">Pharmacist License</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {SAMPLE_REGISTER.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{entry.rxNumber}</div>
                  <div className="text-[10px] text-slate-400">{entry.timestamp}</div>
                </td>
                <td className="py-3 px-3 font-sans">
                  <div className="font-semibold text-slate-900">{entry.medication}</div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {entry.schedule}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div>DEA: <span className="font-bold text-slate-800">{entry.prescriberDea}</span></div>
                  <div className="text-slate-400">NPI: {entry.prescriberNpi}</div>
                </td>
                <td className="py-3 px-3 font-sans">
                  <div className="text-slate-700 font-medium text-[11px]">{entry.patientIdType}</div>
                  <div className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]" title={entry.patientIdHash}>
                    {entry.patientIdHash.slice(0, 16)}...
                  </div>
                </td>
                <td className="py-3 px-3 text-center font-bold text-rose-700 font-mono text-xs">
                  -{entry.dispensedQty}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  <span className="text-slate-400">{entry.priorBalance}</span>
                  <span className="mx-1 text-slate-300">→</span>
                  <span className="font-bold text-slate-900">{entry.newBalance}</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                  {entry.pharmacistLicense}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
