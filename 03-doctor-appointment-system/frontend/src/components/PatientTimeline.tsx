'use client';

import React from 'react';
import { Calendar, Video, FileText, CheckCircle2, Clock, RotateCcw, AlertCircle } from 'lucide-react';

interface PatientAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  dateTime: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  hasNotes: boolean;
  isVideoReady: boolean;
}

const APPOINTMENTS: PatientAppointment[] = [
  {
    id: 'apt_1',
    doctorName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiology',
    clinic: 'Carewell Outpatient Pavilion',
    dateTime: 'Monday, Nov 23, 2026 @ 09:00 AM EST',
    status: 'CONFIRMED',
    hasNotes: false,
    isVideoReady: true
  },
  {
    id: 'apt_2',
    doctorName: 'Dr. Michael Chang, MD',
    specialty: 'Dermatology',
    clinic: 'Carewell Downtown Medical Center',
    dateTime: 'Thursday, Nov 12, 2026 @ 11:30 AM EST',
    status: 'COMPLETED',
    hasNotes: true,
    isVideoReady: false
  }
];

export const PatientTimeline: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Patient Consultation Timeline</h3>
          <p className="text-xs text-slate-500">Track upcoming bookings, teleconsultation links, and clinical summaries.</p>
        </div>
      </div>

      <div className="space-y-4">
        {APPOINTMENTS.map((apt) => (
          <div key={apt.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  apt.status === 'CONFIRMED'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {apt.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {apt.id}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{apt.doctorName} ({apt.specialty})</h4>
              <p className="text-xs text-slate-600">{apt.clinic}</p>
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> {apt.dateTime}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {apt.isVideoReady && (
                <button
                  onClick={() => alert("Launching HIPAA-compliant video session window.")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" /> Join Telehealth
                </button>
              )}
              {apt.hasNotes && (
                <button
                  onClick={() => alert("Decrypted Clinical Note: Patient exhibits normal sinus rhythm. Continue standard protocol.")}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-600" /> View Clinical Notes
                </button>
              )}
              {apt.status === 'CONFIRMED' && (
                <button
                  onClick={() => alert("Atomic Rescheduling initiated. Select a replacement slot.")}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
