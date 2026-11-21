'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Check, ShieldAlert } from 'lucide-react';

interface SlotPickerModalProps {
  doctor: any;
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_SLOTS = [
  { id: 's1', time: '09:00 AM - 09:30 AM', date: 'Monday, Nov 23, 2026' },
  { id: 's2', time: '09:35 AM - 10:05 AM', date: 'Monday, Nov 23, 2026' },
  { id: 's3', time: '10:10 AM - 10:40 AM', date: 'Monday, Nov 23, 2026' },
  { id: 's4', time: '02:00 PM - 02:30 PM', date: 'Tuesday, Nov 24, 2026' }
];

export const SlotPickerModal: React.FC<SlotPickerModalProps> = ({ doctor, isOpen, onClose }) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string>('s1');
  const [reason, setReason] = useState('Routine annual cardiology review');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleConfirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-0.5">Book Consultation</h3>
        <p className="text-xs text-slate-500 mb-4">{doctor.name} • {doctor.specialty}</p>

        {bookingSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Appointment Confirmed!</h4>
            <p className="text-xs text-slate-500">Atomic reservation complete. Details sent via notification adapter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Select Available Time Slot</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_SLOTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlotId(s.id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between transition-colors ${
                      selectedSlotId === s.id
                        ? 'border-sky-500 bg-sky-50/70 text-sky-950'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{s.time}</div>
                      <div className="text-[11px] text-slate-500">{s.date}</div>
                    </div>
                    {selectedSlotId === s.id && <Check className="w-4 h-4 text-sky-600 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Visit</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Consultation Fee:</span>
                <span>${doctor.consultationFee}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Cancellation policy: Free cancellation up to 24 hours prior.
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {loading ? "Locking Slot..." : "Confirm & Book Slot"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
