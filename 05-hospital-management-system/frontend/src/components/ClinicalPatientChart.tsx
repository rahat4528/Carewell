'use client';

import React, { useState } from 'react';
import { HeartPulse, ShieldAlert, FileText, Lock, Plus, AlertTriangle, CheckCircle2, User } from 'lucide-react';

export const ClinicalPatientChart: React.FC<{ userRole: string }> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'notes'>('vitals');
  const [notice, setNotice] = useState<string | null>(null);

  const [soapNotes, setSoapNotes] = useState([
    {
      id: 'n1',
      author: 'Dr. Marcus Vance, MD, FACC',
      date: 'Nov 21, 2026 @ 10:15 AM',
      isSigned: true,
      subjective: 'Patient reports improved breathing following initiation of supportive oxygen.',
      objective: 'Lungs clear bilaterally. HR 76, BP 122/78, SpO2 98% on 2L NC. No peripheral edema.',
      assessment: 'Resolving non-cardiac pulmonary congestion. Stable on low-flow cannula.',
      plan: 'Wean oxygen over the next 24 hours. Step-down transfer to General Medical Ward tomorrow.',
      addenda: [
        {
          id: 'a1',
          author: 'Dr. Marcus Vance, MD',
          date: 'Nov 21, 2026 @ 02:30 PM',
          content: 'Addendum: Oxygen weaned successfully to room air. Stepdown transfer approved.'
        }
      ]
    }
  ]);

  const [newNoteSubjective, setNewNoteSubjective] = useState('');
  const [newNoteObjective, setNewNoteObjective] = useState('');
  const [newNoteAssessment, setNewNoteAssessment] = useState('');
  const [newNotePlan, setNewNotePlan] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSaveNote = () => {
    if (!newNoteAssessment || !newNotePlan) {
      alert('Assessment and Plan are required fields.');
      return;
    }
    const newNote = {
      id: `n_${Date.now()}`,
      author: userRole === 'DOCTOR' ? 'Dr. Marcus Vance, MD' : 'Nurse Clara Oswald, RN',
      date: 'Just now',
      isSigned: userRole === 'DOCTOR',
      subjective: newNoteSubjective || 'Patient resting comfortably.',
      objective: newNoteObjective || 'Vitals stable.',
      assessment: newNoteAssessment,
      plan: newNotePlan,
      addenda: []
    };
    setSoapNotes([newNote, ...soapNotes]);
    setIsFormOpen(false);
    setNewNoteSubjective('');
    setNewNoteObjective('');
    setNewNoteAssessment('');
    setNewNotePlan('');
    setNotice(userRole === 'DOCTOR' ? 'Clinical note signed and permanently locked.' : 'Draft note saved.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Patient Demographic Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-black text-lg border border-teal-500/30">
            ER
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">Eleanor Rigby</h3>
              <span className="font-mono text-xs bg-slate-800 text-teal-400 px-2 py-0.5 rounded border border-slate-700">
                MRN-10023-4
              </span>
              <span className="text-xs font-bold text-slate-300">Blood: A+</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              DOB: Aug 15, 1965 (61 y/o) • Location: <span className="text-white font-semibold">ICU Bed 103</span> • Attending: <span className="text-teal-300 font-semibold">Dr. Marcus Vance, MD</span>
            </div>
          </div>
        </div>

        {/* Allergy Alert Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> ALLERGY: Penicillin (Anaphylaxis)
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Latex (Moderate)
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-teal-50 text-teal-900 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'vitals' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Vital Signs Flowsheet
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'notes' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clinical Notes & SOAP Thread
        </button>
      </div>

      {/* Vitals Tab */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Heart Rate', value: '76', unit: 'bpm', status: 'NORMAL' },
              { label: 'Blood Pressure', value: '122 / 78', unit: 'mmHg', status: 'NORMAL' },
              { label: 'SpO2', value: '98', unit: '%', status: 'NORMAL' },
              { label: 'Resp Rate', value: '16', unit: 'bpm', status: 'NORMAL' },
              { label: 'Temperature', value: '37.0', unit: '°C', status: 'NORMAL' },
              { label: 'Alert Triage', value: 'Normal', unit: '', status: 'NORMAL' }
            ].map((v, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">{v.label}</div>
                <div className="text-base font-extrabold text-slate-900 mt-1">{v.value}</div>
                {v.unit && <div className="text-[10px] text-slate-400 font-mono">{v.unit}</div>}
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
            <span>Last recorded 15 minutes ago by Nurse Clara Oswald, RN</span>
            <span className="font-semibold text-teal-700">All physiological parameters within plausible limits</span>
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-sm text-slate-900">Physician SOAP Documentation</h4>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Author SOAP Note
            </button>
          </div>

          {isFormOpen && (
            <div className="p-4 border border-teal-200 bg-teal-50/30 rounded-xl space-y-3 text-xs">
              <h5 className="font-bold text-slate-900">New Clinical Note (SOAP)</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subjective</label>
                  <textarea
                    value={newNoteSubjective}
                    onChange={(e) => setNewNoteSubjective(e.target.value)}
                    placeholder="Patient reports..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Objective</label>
                  <textarea
                    value={newNoteObjective}
                    onChange={(e) => setNewNoteObjective(e.target.value)}
                    placeholder="Physical examination & vitals..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assessment</label>
                  <textarea
                    value={newNoteAssessment}
                    onChange={(e) => setNewNoteAssessment(e.target.value)}
                    placeholder="Clinical assessment..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan</label>
                  <textarea
                    value={newNotePlan}
                    onChange={(e) => setNewNotePlan(e.target.value)}
                    placeholder="Care plan & orders..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow"
                >
                  Sign & Lock Note
                </button>
              </div>
            </div>
          )}

          {/* Notes Thread */}
          <div className="space-y-4">
            {soapNotes.map((note) => (
              <div key={note.id} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">{note.author}</span>
                    <span className="text-[11px] text-slate-400">• {note.date}</span>
                  </div>
                  {note.isSigned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Signed & Locked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Subjective: </span>
                    <span className="text-slate-600">{note.subjective}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Objective: </span>
                    <span className="text-slate-600">{note.objective}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Assessment: </span>
                    <span className="text-slate-600">{note.assessment}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Plan: </span>
                    <span className="text-slate-600">{note.plan}</span>
                  </div>
                </div>

                {note.addenda && note.addenda.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {note.addenda.map((add) => (
                      <div key={add.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                          <span>{add.author} (Addendum)</span>
                          <span className="text-slate-400 font-normal">{add.date}</span>
                        </div>
                        <p className="mt-1 text-slate-700">{add.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
