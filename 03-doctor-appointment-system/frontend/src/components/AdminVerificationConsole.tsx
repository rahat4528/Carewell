'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, XCircle, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface VerificationApplicant {
  id: string;
  name: string;
  licenseNumber: string;
  specialty: string;
  clinic: string;
  submissionDate: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

const INITIAL_APPLICANTS: VerificationApplicant[] = [
  {
    id: 'doc_2',
    name: 'Dr. Emily Vance, MD',
    licenseNumber: 'MD-998231',
    specialty: 'Pediatrics',
    clinic: 'Carewell Outpatient Pavilion',
    submissionDate: 'Nov 19, 2026',
    status: 'PENDING_VERIFICATION'
  },
  {
    id: 'doc_3',
    name: 'Dr. Robert Torres, DO',
    licenseNumber: 'DO-443109',
    specialty: 'Orthopedics',
    clinic: 'Carewell Orthopedic Institute',
    submissionDate: 'Nov 20, 2026',
    status: 'PENDING_VERIFICATION'
  },
  {
    id: 'doc_1',
    name: 'Dr. Sarah Jenkins, MD',
    licenseNumber: 'MD-884920',
    specialty: 'Cardiology',
    clinic: 'Carewell Outpatient Pavilion',
    submissionDate: 'Nov 10, 2026',
    status: 'VERIFIED'
  }
];

export const AdminVerificationConsole: React.FC = () => {
  const [applicants, setApplicants] = useState<VerificationApplicant[]>(INITIAL_APPLICANTS);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: 'VERIFIED' | 'REJECTED', name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    setNotice(`Updated credential verification for ${name}: ${newStatus}`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">Practitioner Credentialing & Verification</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Carewell Clinical Operations Board. Review practitioner medical licenses before enabling public directory booking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>2-Eyes Staff Review Required</span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Practitioner</th>
              <th className="py-3 px-4">Medical License</th>
              <th className="py-3 px-4">Specialty & Clinic</th>
              <th className="py-3 px-4">Submitted</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applicants.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                    {app.name.replace('Dr. ', '').charAt(0)}
                  </div>
                  {app.name}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-600">{app.licenseNumber}</td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">{app.specialty}</div>
                  <div className="text-[11px] text-slate-400">{app.clinic}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-500">{app.submissionDate}</td>
                <td className="py-3.5 px-4">
                  {app.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {app.status === 'PENDING_VERIFICATION' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                  {app.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  {app.status === 'PENDING_VERIFICATION' ? (
                    <>
                      <button
                        onClick={() => handleAction(app.id, 'VERIFIED', app.name)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-sm inline-flex items-center gap-1 transition"
                      >
                        <UserCheck className="w-3 h-3" /> Verify
                      </button>
                      <button
                        onClick={() => handleAction(app.id, 'REJECTED', app.name)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No action pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
