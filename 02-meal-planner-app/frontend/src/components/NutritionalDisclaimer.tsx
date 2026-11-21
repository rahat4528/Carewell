import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const NutritionalDisclaimer: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Nutritional Transparency:</strong> Macro figures are algorithmic estimates based on open food composition data, not clinical nutrition therapy. Please verify physical packaging labels for food allergens.
        </span>
      </div>
      <span className="hidden md:inline-block font-semibold text-amber-800">
        Allergy Emergency? Call local emergency services
      </span>
    </div>
  );
};
