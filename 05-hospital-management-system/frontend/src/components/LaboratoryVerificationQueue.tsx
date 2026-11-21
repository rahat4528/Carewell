'use client';

import React, { useState } from 'react';
import { Microscope, CheckCircle2, Clock, ShieldCheck, AlertTriangle, UserCheck, Plus } from 'lucide-react';

interface LabQueueItem {
  id: string;
  patientName: string;
  mrn: string;
  testCode: string;
  testName: string;
  status: 'ORDERED' | 'COLLECTED' | 'RESULT_PENDING_VERIFICATION' | 'VERIFIED_AND_RELEASED';
  resultValue?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
}

const INITIAL_ORDERS: LabQueueItem[] = [
  {
    id: 'ord_1',
    patientName: 'Eleanor Rigby',
    mrn: 'MRN-10023-4',
    testCode: 'TROPONIN_I',
    testName: 'High Sensitivity Troponin I',
    status: 'VERIFIED_AND_RELEASED',
    resultValue: '0.01 ng/mL',
    referenceRange: '< 0.04 ng/mL',
    isAbnormal: false
  },
  {
    id: 'ord_2',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-20045-8',
    testCode: 'CBC_PLT',
    testName: 'Complete Blood Count (Platelets)',
    status: 'RESULT_PENDING_VERIFICATION',
    resultValue: '95,000 /uL',
    referenceRange: '150,000 - 450,000 /uL',
    isAbnormal: true
  },
  {
    id: 'ord_3',
    patientName: 'Eleanor Rigby',
    mrn: 'MRN-10023-4',
    testCode: 'BMP_K',
    testName: 'Serum Potassium',
    status: 'COLLECTED'
  }
];

export const LaboratoryVerificationQueue: React.FC<{ userRole: string }> = ({ userRole }) => {
  const [orders, setOrders] = useState<LabQueueItem[]>(INITIAL_ORDERS);
  const [activeOrderForEntry, setActiveOrderForEntry] = useState<LabQueueItem | null>(null);
  const [entryValue, setEntryValue] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleEnterResult = () => {
    if (!activeOrderForEntry || !entryValue) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrderForEntry.id
          ? {
              ...o,
              status: 'RESULT_PENDING_VERIFICATION',
              resultValue: entryValue,
              referenceRange: '3.5 - 5.0 mEq/L',
              isAbnormal: parseFloat(entryValue) > 5.0
            }
          : o
      )
    );
    setActiveOrderForEntry(null);
    setEntryValue('');
    setNotice(`Result entered for ${activeOrderForEntry.testName}. Status: RESULT_PENDING_VERIFICATION.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleVerify = (orderId: string, testName: string) => {
    if (userRole !== 'PATHOLOGIST' && userRole !== 'DOCTOR') {
      alert('Only a Pathologist or Attending Doctor can verify lab results (4-Eyes Principle).');
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'VERIFIED_AND_RELEASED' } : o))
    );
    setNotice(`Verified and released ${testName} to patient chart.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Laboratory 4-Eyes Verification Queue</h3>
          <p className="text-xs text-slate-500">
            Mandatory dual review: Lab technicians input raw specimen values; certified pathologists verify before release to the EHR chart.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
          Active Role: <span className="font-bold text-teal-700">{userRole}</span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-teal-50 text-teal-900 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Patient & MRN</th>
              <th className="py-3 px-3">Test Name & Code</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Result & Reference</th>
              <th className="py-3 px-3 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition">
                <td className="py-3.5 px-3">
                  <div className="font-bold text-slate-900">{o.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{o.mrn}</div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="font-semibold text-slate-900">{o.testName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{o.testCode}</div>
                </td>
                <td className="py-3.5 px-3">
                  {o.status === 'ORDERED' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      ORDERED
                    </span>
                  )}
                  {o.status === 'COLLECTED' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      COLLECTED
                    </span>
                  )}
                  {o.status === 'RESULT_PENDING_VERIFICATION' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      PENDING PATHOLOGIST REVIEW
                    </span>
                  )}
                  {o.status === 'VERIFIED_AND_RELEASED' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> RELEASED TO CHART
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3">
                  {o.resultValue ? (
                    <div>
                      <div className={`font-mono font-bold ${o.isAbnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                        {o.resultValue} {o.isAbnormal && <span className="text-[10px] bg-rose-100 text-rose-800 px-1 rounded ml-1 font-sans">CRITICAL</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.referenceRange}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No result recorded</span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-right">
                  {o.status === 'COLLECTED' && (
                    <button
                      onClick={() => setActiveOrderForEntry(o)}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow-sm inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Enter Tech Result
                    </button>
                  )}
                  {o.status === 'RESULT_PENDING_VERIFICATION' && (
                    <button
                      onClick={() => handleVerify(o.id, o.testName)}
                      disabled={userRole !== 'PATHOLOGIST' && userRole !== 'DOCTOR'}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm inline-flex items-center gap-1 transition ${
                        userRole === 'PATHOLOGIST' || userRole === 'DOCTOR'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={userRole !== 'PATHOLOGIST' && userRole !== 'DOCTOR' ? 'Requires Pathologist or Attending Doctor' : ''}
                    >
                      <UserCheck className="w-3 h-3" /> Pathologist Verify
                    </button>
                  )}
                  {o.status === 'VERIFIED_AND_RELEASED' && (
                    <span className="text-[11px] text-slate-400 italic">Verified & Signed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tech Entry Modal */}
      {activeOrderForEntry && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h4 className="font-extrabold text-sm text-slate-900">Lab Technician Result Entry</h4>
            <p className="text-slate-600">
              Entering specimen analysis for <strong>{activeOrderForEntry.testName}</strong> ({activeOrderForEntry.patientName}).
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Observed Numeric Value</label>
              <input
                type="text"
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder="e.g. 4.8 mEq/L"
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveOrderForEntry(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEnterResult}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shadow"
              >
                Submit for 4-Eyes Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
