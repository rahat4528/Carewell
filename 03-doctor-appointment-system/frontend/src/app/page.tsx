'use client';

import React, { useState } from 'react';
import { PortalNavbar } from '../components/PortalNavbar';
import { ClinicDisclaimer } from '../components/ClinicDisclaimer';
import { DoctorSearch } from '../components/DoctorSearch';
import { SlotPickerModal } from '../components/SlotPickerModal';
import { PatientTimeline } from '../components/PatientTimeline';
import { DoctorDaySchedule } from '../components/DoctorDaySchedule';
import { AdminVerificationConsole } from '../components/AdminVerificationConsole';

export default function AppointmentPortalPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'patient-timeline' | 'doctor-schedule' | 'admin-verify'>('search');
  const [userRole, setUserRole] = useState<'PATIENT' | 'DOCTOR' | 'ADMIN'>('PATIENT');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<any | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  const handleOpenBooking = (doctor: any) => {
    setSelectedDoctorForBooking(doctor);
    setIsSlotModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <PortalNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clinical Safety & Non-Diagnostic Disclaimer Banner */}
        <ClinicDisclaimer />

        {/* Dynamic Tab Views */}
        {activeTab === 'search' && (
          <DoctorSearch onSelectDoctor={handleOpenBooking} />
        )}

        {activeTab === 'patient-timeline' && (
          <PatientTimeline />
        )}

        {activeTab === 'doctor-schedule' && (
          <DoctorDaySchedule />
        )}

        {activeTab === 'admin-verify' && (
          <AdminVerificationConsole />
        )}
      </main>

      {/* Booking Slot Selection Modal */}
      <SlotPickerModal
        doctor={selectedDoctorForBooking}
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setSelectedDoctorForBooking(null);
        }}
      />

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Carewell Doctor Appointment & Outpatient Scheduling System</p>
        <p className="mt-1">
          Strict relationship-based record access • AES-256-GCM clinical note encryption • Tamper-evident audit logging
        </p>
      </footer>
    </div>
  );
}
