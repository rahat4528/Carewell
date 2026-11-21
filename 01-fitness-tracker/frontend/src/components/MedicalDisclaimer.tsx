import React from 'react';
import { AlertCircle } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Informational Tool Only:</strong> Carewell Fitness Tracker does not provide medical diagnoses, treatment decisions, or clinical advice. All calorie numbers are algorithmic estimates (MET formulation).
        </span>
      </div>
      <span className="hidden md:inline-block font-semibold text-amber-700 dark:text-amber-400">
        Emergency? Call local emergency services
      </span>
    </div>
  );
};
