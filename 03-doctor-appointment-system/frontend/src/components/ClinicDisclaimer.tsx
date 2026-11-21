import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ClinicDisclaimer: React.FC = () => {
  return (
    <div className="bg-sky-500/10 border border-sky-500/30 text-sky-950 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
        <span>
          <strong>Administrative Scheduling Tool:</strong> Carewell Doctor Appointment System facilitates clinical appointments and schedules. It does not provide medical triage, urgent clinical advice, or autonomous diagnoses.
        </span>
      </div>
      <span className="hidden md:inline-block font-semibold text-sky-800">
        Medical Emergency? Call local emergency services immediately
      </span>
    </div>
  );
};
