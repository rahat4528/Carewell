'use client';

import React, { useState } from 'react';
import { Download, Trash2, X, ShieldAlert, Check } from 'lucide-react';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Mock JSON export payload
      const mockExport = {
        system: "Carewell Fitness Tracker",
        version: "1.0.0",
        exportTimestamp: new Date().toISOString(),
        profile: {
          name: "Alex Morgan",
          email: "demo@carewell.local",
          unitSystem: "METRIC",
          heightCm: 178.0,
          weightKg: 76.5
        },
        sessionsCompleted: 12,
        personalRecords: [
          { exercise: "Barbell Bench Press", heaviestWeightKg: 100.0, estimated1RmKg: 110.0 }
        ]
      };

      const blob = new Blob([JSON.stringify(mockExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carewell-fitness-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Privacy & Data Sovereignty
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Carewell adheres to consumer privacy standards. You retain full control over your telemetry.
        </p>

        {/* Export Section */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 mb-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Export Personal Data</h4>
          <p className="text-xs text-slate-500 mb-3">
            Download an unencrypted, machine-readable JSON archive of all your workouts, sets, body measurements, and goals.
          </p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4" /> Download Complete
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> {downloading ? "Compiling JSON..." : "Download JSON Archive"}
              </>
            )}
          </button>
        </div>

        {/* Delete Section */}
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm mb-1">
            <ShieldAlert className="w-4 h-4" /> Account Erasure
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Permanently delete your profile and cascade purge all sessions, telemetry, and device integration tokens.
          </p>
          <button
            onClick={() => alert("To erase account, please confirm in settings.")}
            className="w-full py-2 px-3 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300 dark:border-rose-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Permanently Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};
