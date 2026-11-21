'use client';

import React, { useState } from 'react';
import { HospitalNavbar } from '../components/HospitalNavbar';
import { HospitalDisclaimer } from '../components/HospitalDisclaimer';
import { WardBedBoard } from '../components/WardBedBoard';
import { ClinicalPatientChart } from '../components/ClinicalPatientChart';
import { LaboratoryVerificationQueue } from '../components/LaboratoryVerificationQueue';
import { BreakGlassConsole } from '../components/BreakGlassConsole';

export default function HospitalPortalPage() {
  const [activeTab, setActiveTab] = useState<'beds' | 'chart' | 'lab' | 'break-glass'>('beds');
  const [userRole, setUserRole] = useState<'DOCTOR' | 'NURSE' | 'PATHOLOGIST' | 'LAB_TECH' | 'ADMIN'>('DOCTOR');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <HospitalNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clinical Safety & Non-Diagnostic Notice */}
        <HospitalDisclaimer />

        {/* Dynamic Views */}
        {activeTab === 'beds' && (
          <WardBedBoard />
        )}

        {activeTab === 'chart' && (
          <ClinicalPatientChart userRole={userRole} />
        )}

        {activeTab === 'lab' && (
          <LaboratoryVerificationQueue userRole={userRole} />
        )}

        {activeTab === 'break-glass' && (
          <BreakGlassConsole />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Carewell Hospital Management System</p>
        <p className="mt-1">
          Enterprise Inpatient EHR • Atomic Bed Allocation • Laboratory 4-Eyes Dual Verification • ReBAC & Emergency Break-Glass
        </p>
      </footer>
    </div>
  );
}
