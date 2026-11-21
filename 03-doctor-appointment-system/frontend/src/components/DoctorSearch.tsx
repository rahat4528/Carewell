'use client';

import React, { useState } from 'react';
import { Search, MapPin, Star, Calendar, ShieldCheck, DollarSign } from 'lucide-react';

interface DoctorCardData {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  location: string;
  consultationFee: number;
  rating: number;
  ratingCount: number;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION';
  nextAvailableSlot: string;
}

const DOCTORS_DATA: DoctorCardData[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiology',
    clinic: 'Carewell Outpatient Pavilion',
    location: 'New York, NY',
    consultationFee: 200,
    rating: 4.9,
    ratingCount: 38,
    verificationStatus: 'VERIFIED',
    nextAvailableSlot: 'Monday, Nov 23 @ 09:00 AM'
  },
  {
    id: 'd2',
    name: 'Dr. Michael Chang, MD',
    specialty: 'Dermatology',
    clinic: 'Carewell Downtown Medical Center',
    location: 'New York, NY',
    consultationFee: 175,
    rating: 4.8,
    ratingCount: 24,
    verificationStatus: 'VERIFIED',
    nextAvailableSlot: 'Tuesday, Nov 24 @ 10:30 AM'
  },
  {
    id: 'd3',
    name: 'Dr. Emily Vance, MD',
    specialty: 'Pediatrics',
    clinic: 'Carewell Outpatient Pavilion',
    location: 'New York, NY',
    consultationFee: 150,
    rating: 5.0,
    ratingCount: 12,
    verificationStatus: 'VERIFIED',
    nextAvailableSlot: 'Wednesday, Nov 25 @ 02:00 PM'
  }
];

const SPECIALTIES = ['All Specialties', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Family Medicine'];

export const DoctorSearch: React.FC<{ onSelectDoctor: (doctor: DoctorCardData) => void }> = ({ onSelectDoctor }) => {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');

  const filtered = DOCTORS_DATA.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Find Doctors & Outpatient Clinics</h3>
          <p className="text-xs text-slate-500">Discover verified medical practitioners and book available consultation slots.</p>
        </div>
      </div>

      {/* Search Input & Specialty Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by physician name, specialty, or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:border-sky-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                    {doc.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-4 h-4 text-sky-600" title="Verified Practitioner" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                    {doc.specialty}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  <Star className="w-3.5 h-3.5 fill-current" /> {doc.rating} ({doc.ratingCount})
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.clinic} • {doc.location}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Consultation Fee: ${doc.consultationFee}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Next: <strong className="text-slate-800">{doc.nextAvailableSlot}</strong>
              </div>
              <button
                onClick={() => onSelectDoctor(doc)}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Slot
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
