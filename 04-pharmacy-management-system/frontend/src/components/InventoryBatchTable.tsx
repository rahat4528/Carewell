'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Plus, ShieldAlert, CheckCircle2, PackageCheck, Clock, Archive } from 'lucide-react';

interface BatchItem {
  id: string;
  lotNumber: string;
  expiryDate: string;
  currentQty: number;
  initialQty: number;
  sellingPriceCents: number;
  costPriceCents: number;
  isQuarantined: boolean;
}

interface MedicationRow {
  id: string;
  ndc: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  deaSchedule: string;
  reorderLevel: number;
  totalStock: number;
  batches: BatchItem[];
}

const INITIAL_MEDS: MedicationRow[] = [
  {
    id: 'm1',
    ndc: '00093-3109-01',
    brandName: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    dosageForm: 'Capsule',
    strength: '500mg',
    deaSchedule: 'NON_CONTROLLED',
    reorderLevel: 50,
    totalStock: 350,
    batches: [
      { id: 'b1', lotNumber: 'AMX-2026A', expiryDate: '2026-12-15', currentQty: 100, initialQty: 100, sellingPriceCents: 1850, costPriceCents: 620, isQuarantined: false },
      { id: 'b2', lotNumber: 'AMX-2027B', expiryDate: '2027-08-20', currentQty: 250, initialQty: 250, sellingPriceCents: 1850, costPriceCents: 600, isQuarantined: false },
      { id: 'b3', lotNumber: 'AMX-2025X', expiryDate: '2025-10-01', currentQty: 40, initialQty: 40, sellingPriceCents: 1850, costPriceCents: 620, isQuarantined: true }
    ]
  },
  {
    id: 'm2',
    ndc: '00406-1144-01',
    brandName: 'Ritalin 10mg',
    genericName: 'Methylphenidate HCl',
    dosageForm: 'Tablet',
    strength: '10mg',
    deaSchedule: 'SCHEDULE_II',
    reorderLevel: 25,
    totalStock: 150,
    batches: [
      { id: 'b4', lotNumber: 'MPH-2026A', expiryDate: '2026-11-28', currentQty: 150, initialQty: 150, sellingPriceCents: 8500, costPriceCents: 3200, isQuarantined: false }
    ]
  },
  {
    id: 'm3',
    ndc: '00573-0160-20',
    brandName: 'Advil Liqui-Gels 200mg',
    genericName: 'Ibuprofen',
    dosageForm: 'Capsule',
    strength: '200mg',
    deaSchedule: 'NON_CONTROLLED',
    reorderLevel: 40,
    totalStock: 500,
    batches: [
      { id: 'b5', lotNumber: 'IBU-2027A', expiryDate: '2027-09-10', currentQty: 500, initialQty: 500, sellingPriceCents: 1099, costPriceCents: 450, isQuarantined: false }
    ]
  }
];

export const InventoryBatchTable: React.FC = () => {
  const [meds, setMeds] = useState<MedicationRow[]>(INITIAL_MEDS);
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('ALL');
  const [expandedMedId, setExpandedMedId] = useState<string | null>('m1');
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = meds.filter((m) => {
    const matchesSearch =
      m.brandName.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.ndc.includes(search);
    const matchesSchedule = scheduleFilter === 'ALL' || m.deaSchedule === scheduleFilter;
    return matchesSearch && matchesSchedule;
  });

  const handleQuarantine = (medId: string, lotNumber: string) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        return {
          ...m,
          batches: m.batches.map((b) => (b.lotNumber === lotNumber ? { ...b, isQuarantined: true } : b))
        };
      })
    );
    setNotice(`Quarantined batch ${lotNumber} from patient dispensing allocation.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">FEFO Batch Inventory & Perpetual Stock</h3>
          <p className="text-xs text-slate-500">
            First-Expired, First-Out allocation engine. Batches automatically sort by expiration date to prevent obsolescence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition">
            <Plus className="w-3.5 h-3.5" /> Goods Receipt (New Batch)
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by NDC, brand name, or active ingredient..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'NON_CONTROLLED', 'SCHEDULE_II'].map((sched) => (
            <button
              key={sched}
              onClick={() => setScheduleFilter(sched)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                scheduleFilter === sched
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sched === 'ALL' ? 'All Items' : sched.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-4">
        {filtered.map((m) => (
          <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => setExpandedMedId(expandedMedId === m.id ? null : m.id)}
              className="p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{m.brandName}</span>
                    <span className="text-xs text-slate-500">({m.genericName} • {m.strength})</span>
                    {m.deaSchedule !== 'NON_CONTROLLED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {m.deaSchedule}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    NDC: {m.ndc} • Form: {m.dosageForm} • Reorder Level: {m.reorderLevel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">On-Hand Stock</div>
                  <div className="text-base font-extrabold text-slate-900">{m.totalStock} units</div>
                </div>
                <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  {expandedMedId === m.id ? 'Collapse' : 'View Batches'}
                </button>
              </div>
            </div>

            {/* Batches Table (FEFO View) */}
            {expandedMedId === m.id && (
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Manufacturing Batches (Ordered by FEFO Expiration)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2 px-3">Lot Number</th>
                        <th className="py-2 px-3">Expiry Date</th>
                        <th className="py-2 px-3">FEFO Urgency</th>
                        <th className="py-2 px-3">Quantity</th>
                        <th className="py-2 px-3">Acq Cost</th>
                        <th className="py-2 px-3">Retail Price</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {m.batches.map((b, idx) => {
                        const isExpired = new Date(b.expiryDate) < new Date();
                        return (
                          <tr key={b.id} className={b.isQuarantined ? 'bg-rose-50/40 text-slate-400' : ''}>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                              {idx === 0 && !b.isQuarantined && !isExpired && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Next in FEFO queue" />
                              )}
                              {b.lotNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono">{b.expiryDate}</td>
                            <td className="py-2.5 px-3">
                              {b.isQuarantined ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                  QUARANTINED
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  EXPIRED
                                </span>
                              ) : idx === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  1ST FEFO PICK
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                                  BACKUP BATCH
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">{b.currentQty} / {b.initialQty}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">${(b.costPriceCents / 100).toFixed(2)}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">
                              ${(b.sellingPriceCents / 100).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {!b.isQuarantined && (
                                <button
                                  onClick={() => handleQuarantine(m.id, b.lotNumber)}
                                  className="text-[11px] font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                                >
                                  <Archive className="w-3 h-3" /> Quarantine
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
