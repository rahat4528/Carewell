'use client';

import React, { useState } from 'react';
import { BedDouble, Building, ArrowRightLeft, Sparkles, CheckCircle2, UserPlus, AlertCircle } from 'lucide-react';

interface BedItem {
  id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  patientName?: string;
  mrn?: string;
}

interface WardData {
  id: string;
  name: string;
  specialty: string;
  floor: number;
  dailyRateCents: number;
  beds: BedItem[];
}

const INITIAL_WARDS: WardData[] = [
  {
    id: 'w1',
    name: 'Intensive Care Unit (ICU)',
    specialty: 'ICU',
    floor: 4,
    dailyRateCents: 250000,
    beds: [
      { id: 'b1', bedNumber: 'ICU-101', status: 'AVAILABLE' },
      { id: 'b2', bedNumber: 'ICU-102', status: 'AVAILABLE' },
      { id: 'b3', bedNumber: 'ICU-103', status: 'OCCUPIED', patientName: 'Eleanor Rigby', mrn: 'MRN-10023-4' }
    ]
  },
  {
    id: 'w2',
    name: 'General Medical Ward',
    specialty: 'GENERAL_MEDICINE',
    floor: 3,
    dailyRateCents: 75000,
    beds: [
      { id: 'b4', bedNumber: 'MED-301', status: 'AVAILABLE' },
      { id: 'b5', bedNumber: 'MED-302', status: 'AVAILABLE' },
      { id: 'b6', bedNumber: 'MED-303', status: 'CLEANING' }
    ]
  },
  {
    id: 'w3',
    name: 'Surgical Recovery Ward',
    specialty: 'SURGICAL',
    floor: 2,
    dailyRateCents: 120000,
    beds: [
      { id: 'b7', bedNumber: 'SURG-201', status: 'AVAILABLE' },
      { id: 'b8', bedNumber: 'SURG-202', status: 'AVAILABLE' }
    ]
  }
];

export const WardBedBoard: React.FC = () => {
  const [wards, setWards] = useState<WardData[]>(INITIAL_WARDS);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCleanBed = (wardId: string, bedId: string, bedNumber: string) => {
    setWards((prev) =>
      prev.map((w) => {
        if (w.id !== wardId) return w;
        return {
          ...w,
          beds: w.beds.map((b) => (b.id === bedId ? { ...b, status: 'AVAILABLE' } : b))
        };
      })
    );
    setNotice(`Bed ${bedNumber} sanitized and marked AVAILABLE.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleStepdownTransfer = () => {
    // Transfers Eleanor Rigby from ICU-103 to MED-301
    setWards((prev) =>
      prev.map((w) => {
        if (w.id === 'w1') {
          return {
            ...w,
            beds: w.beds.map((b) =>
              b.id === 'b3' ? { ...b, status: 'CLEANING', patientName: undefined, mrn: undefined } : b
            )
          };
        }
        if (w.id === 'w2') {
          return {
            ...w,
            beds: w.beds.map((b) =>
              b.id === 'b4' ? { ...b, status: 'OCCUPIED', patientName: 'Eleanor Rigby', mrn: 'MRN-10023-4' } : b
            )
          };
        }
        return w;
      })
    );
    setNotice('Atomic transfer completed: Eleanor Rigby transferred from ICU-103 to MED-301 (ICU-103 set to CLEANING).');
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Inpatient Ward & Bed Board</h3>
          <p className="text-xs text-slate-500">
            Real-time census monitoring, atomic admissions, and inter-ward bed transfer orchestration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStepdownTransfer}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Execute ICU Stepdown Transfer
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-teal-50 text-teal-900 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Ward Cards */}
      <div className="space-y-6">
        {wards.map((ward) => {
          const occupiedCount = ward.beds.filter((b) => b.status === 'OCCUPIED').length;
          const occupancyRate = Math.round((occupiedCount / ward.beds.length) * 100);

          return (
            <div key={ward.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 text-teal-800 rounded-xl font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ward.name}</h4>
                    <div className="text-[11px] text-slate-500">
                      Floor {ward.floor} • Rate: ${(ward.dailyRateCents / 100).toFixed(2)}/day
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <span className="font-semibold text-slate-600">Occupancy: </span>
                    <span className="font-extrabold text-slate-900">{occupiedCount} / {ward.beds.length} beds ({occupancyRate}%)</span>
                  </div>
                </div>
              </div>

              {/* Bed Grid */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white">
                {ward.beds.map((bed) => (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-xl border transition-all ${
                      bed.status === 'OCCUPIED'
                        ? 'bg-rose-50/50 border-rose-200'
                        : bed.status === 'AVAILABLE'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="font-mono font-bold text-xs text-slate-900">{bed.bedNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bed.status === 'OCCUPIED'
                            ? 'bg-rose-200 text-rose-800'
                            : bed.status === 'AVAILABLE'
                            ? 'bg-emerald-200 text-emerald-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {bed.status}
                      </span>
                    </div>

                    <div className="mt-2.5 text-xs">
                      {bed.status === 'OCCUPIED' ? (
                        <div>
                          <div className="font-bold text-slate-900">{bed.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{bed.mrn}</div>
                        </div>
                      ) : bed.status === 'CLEANING' ? (
                        <div className="space-y-2">
                          <div className="text-[11px] text-amber-800 font-medium">Post-discharge sterilization required</div>
                          <button
                            onClick={() => handleCleanBed(ward.id, bed.id, bed.bedNumber)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Sparkles className="w-3 h-3" /> Mark Sanitized
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">Ready for admission</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
