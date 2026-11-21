'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldAlert, XCircle, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';

interface PrescriptionQueueItem {
  id: string;
  rxNumber: string;
  patientName: string;
  patientDob: string;
  prescriberName: string;
  prescriberNpi: string;
  prescriberDea?: string;
  medicationName: string;
  quantity: number;
  instructions: string;
  isControlled: boolean;
  status: 'PENDING_REVIEW' | 'PHARMACIST_APPROVED' | 'DISPENSED';
  fefoBatchPicked?: string;
}

const INITIAL_PRESCRIPTIONS: PrescriptionQueueItem[] = [
  {
    id: 'rx1',
    rxNumber: 'RX-8849201',
    patientName: 'Jane Doe',
    patientDob: '1988-04-12',
    prescriberName: 'Dr. Alan Grant, MD',
    prescriberNpi: '1098765432',
    medicationName: 'Amoxicillin 500mg',
    quantity: 21,
    instructions: '1 capsule TID for 7 days',
    isControlled: false,
    status: 'PENDING_REVIEW'
  },
  {
    id: 'rx2',
    rxNumber: 'RX-9948204',
    patientName: 'Robert Langdon',
    patientDob: '1975-06-22',
    prescriberName: 'Dr. Gregory House, MD',
    prescriberNpi: '1098765432',
    prescriberDea: 'AB1234563',
    medicationName: 'Ritalin 10mg',
    quantity: 30,
    instructions: '1 tablet PO every morning',
    isControlled: true,
    status: 'PHARMACIST_APPROVED',
    fefoBatchPicked: 'MPH-2026A (Exp: 2026-11-28)'
  }
];

export const PrescriptionReviewQueue: React.FC<{ userRole: string }> = ({ userRole }) => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionQueueItem[]>(INITIAL_PRESCRIPTIONS);
  const [activeControlledRx, setActiveControlledRx] = useState<PrescriptionQueueItem | null>(null);
  const [patientIdType, setPatientIdType] = useState('DRIVERS_LICENSE');
  const [patientIdNumber, setPatientIdNumber] = useState('DL-994821');
  const [notice, setNotice] = useState<string | null>(null);

  const handleApprove = (id: string, rxNumber: string) => {
    if (userRole !== 'PHARMACIST') {
      alert('Only a licensed Pharmacist can authorize prescription reviews.');
      return;
    }
    setPrescriptions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'PHARMACIST_APPROVED', fefoBatchPicked: 'AMX-2026A (Exp: 2026-12-15)' } : r
      )
    );
    setNotice(`Prescription ${rxNumber} approved by Pharmacist.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDispenseClick = (rx: PrescriptionQueueItem) => {
    if (rx.status !== 'PHARMACIST_APPROVED') {
      alert('Prescription must be reviewed and approved by a Pharmacist before dispensing.');
      return;
    }
    if (rx.isControlled) {
      if (userRole !== 'PHARMACIST') {
        alert('Controlled substances (Schedule II-V) can only be dispensed by a licensed Pharmacist.');
        return;
      }
      setActiveControlledRx(rx);
      return;
    }
    executeDispense(rx.id, rx.rxNumber);
  };

  const executeDispense = (id: string, rxNumber: string) => {
    setPrescriptions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'DISPENSED' } : r))
    );
    setActiveControlledRx(null);
    setNotice(`Prescription ${rxNumber} dispensed successfully via FEFO.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Prescription Review & Dispensing Queue</h3>
          <p className="text-xs text-slate-500">
            Pharmacist verification gate. Two-stage statutory workflow before drug release.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
          Active Role: <span className="font-bold text-emerald-700">{userRole}</span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-4">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{rx.rxNumber}</span>
                <span className="text-xs font-semibold text-slate-700">• {rx.patientName} ({rx.patientDob})</span>
                {rx.isControlled && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> DEA Controlled
                  </span>
                )}
                {rx.status === 'PENDING_REVIEW' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    PENDING REVIEW
                  </span>
                )}
                {rx.status === 'PHARMACIST_APPROVED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                    READY FOR DISPENSE
                  </span>
                )}
                {rx.status === 'DISPENSED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    DISPENSED
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 font-medium">
                Prescribed: <span className="font-bold text-slate-900">{rx.medicationName}</span> (Qty: {rx.quantity}) • Prescriber: {rx.prescriberName} (NPI: {rx.prescriberNpi})
              </div>
              <div className="text-[11px] text-slate-500 italic">Sig: "{rx.instructions}"</div>

              {rx.fefoBatchPicked && (
                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mt-1">
                  FEFO Target Batch: {rx.fefoBatchPicked}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {rx.status === 'PENDING_REVIEW' && (
                <button
                  onClick={() => handleApprove(rx.id, rx.rxNumber)}
                  disabled={userRole !== 'PHARMACIST'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition ${
                    userRole === 'PHARMACIST'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={userRole !== 'PHARMACIST' ? 'Requires PHARMACIST role' : ''}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Pharmacist Approve
                </button>
              )}

              {rx.status === 'PHARMACIST_APPROVED' && (
                <button
                  onClick={() => handleDispenseClick(rx)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Execute FEFO Dispense
                </button>
              )}

              {rx.status === 'DISPENSED' && (
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controlled Substance Verification Modal */}
      {activeControlledRx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="font-extrabold text-base">DEA Controlled Substance Dispensing Gate</h4>
            </div>

            <p className="text-xs text-slate-600">
              Releasing <strong>{activeControlledRx.medicationName}</strong> (Schedule II) requires physical patient photo ID recording and pharmacist DEA log validation.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prescriber DEA Number</label>
                <input
                  type="text"
                  disabled
                  value={activeControlledRx.prescriberDea || 'AB1234563'}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Photo ID Type</label>
                <select
                  value={patientIdType}
                  onChange={(e) => setPatientIdType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="STATE_ID">State Issued ID</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Photo ID Number</label>
                <input
                  type="text"
                  value={patientIdNumber}
                  onChange={(e) => setPatientIdNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono"
                  placeholder="e.g. DL-1234567"
                />
              </div>

              <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-[11px]">
                The ID number is cryptographically hashed with SHA-256 before being committed to the perpetual register.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveControlledRx(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDispense(activeControlledRx.id, activeControlledRx.rxNumber)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                Sign & Authorize Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
