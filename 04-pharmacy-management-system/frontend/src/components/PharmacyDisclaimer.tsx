import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const PharmacyDisclaimer: React.FC = () => {
  return (
    <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-100 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide uppercase text-[11px] bg-emerald-800 px-2 py-0.5 rounded">
            Administrative & Dispensary Protocol Notice
          </span>
          <span className="text-emerald-300 font-semibold">• Statutory Pharmacist Verification Required</span>
        </div>
        <p className="text-emerald-200/90 leading-relaxed">
          The Carewell Pharmacy Management System manages FEFO batch stock allocation, retail point-of-sale billing, and DEA compliance records.
          <strong> It does not make autonomous clinical diagnoses, therapeutic substitution decisions, or clinical dosage approvals.</strong> All drug release workflows must be authorized by a licensed, registered human pharmacist.
        </p>
      </div>
    </div>
  );
};
