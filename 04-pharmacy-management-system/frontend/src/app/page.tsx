'use client';

import React, { useState } from 'react';
import { PharmacyNavbar } from '../components/PharmacyNavbar';
import { PharmacyDisclaimer } from '../components/PharmacyDisclaimer';
import { InventoryBatchTable } from '../components/InventoryBatchTable';
import { PrescriptionReviewQueue } from '../components/PrescriptionReviewQueue';
import { PosCheckoutTerminal } from '../components/PosCheckoutTerminal';
import { ControlledSubstanceRegister } from '../components/ControlledSubstanceRegister';

export default function PharmacyPortalPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'pos' | 'controlled'>('inventory');
  const [userRole, setUserRole] = useState<'PHARMACIST' | 'PHARMACY_TECH' | 'ADMIN'>('PHARMACIST');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <PharmacyNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clinical Safety & Statutory Pharmacist Mandate Notice */}
        <PharmacyDisclaimer />

        {/* Dynamic Views */}
        {activeTab === 'inventory' && (
          <InventoryBatchTable />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionReviewQueue userRole={userRole} />
        )}

        {activeTab === 'pos' && (
          <PosCheckoutTerminal />
        )}

        {activeTab === 'controlled' && (
          <ControlledSubstanceRegister />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Carewell Pharmacy Management & Dispensary System</p>
        <p className="mt-1">
          FEFO Batch Inventory • Integer Cents POS Engine • DEA Title 21 CFR Part 1304 Compliant Register
        </p>
      </footer>
    </div>
  );
}
