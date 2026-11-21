import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const HospitalDisclaimer: React.FC = () => {
  return (
    <div className="bg-teal-950/90 border border-teal-800 text-teal-100 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
      <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl shrink-0 mt-0.5">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide uppercase text-[11px] bg-teal-800 px-2 py-0.5 rounded">
            Hospital Clinical Operations & Documentation Notice
          </span>
          <span className="text-teal-300 font-semibold">• Licensed Physician Authorization Required</span>
        </div>
        <p className="text-teal-200/90 leading-relaxed">
          The Carewell Hospital Management System orchestrates inpatient bed allocation, laboratory 4-eyes verification, and electronic health record documentation.
          <strong> It does not make autonomous clinical diagnoses, therapeutic orders, or automated medical decisions.</strong> All care plans, vitals interpretations, and lab reviews must be validated by authorized healthcare professionals.
        </p>
      </div>
    </div>
  );
};
