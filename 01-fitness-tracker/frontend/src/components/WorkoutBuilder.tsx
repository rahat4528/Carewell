'use client';

import React, { useState } from 'react';
import { Plus, Check, Trash2, Dumbbell, PlayCircle } from 'lucide-react';

interface SetItem {
  id: string;
  setNumber: number;
  setType: 'WARMUP' | 'NORMAL' | 'DROPSET' | 'FAILURE';
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

interface ExerciseBlock {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  sets: SetItem[];
}

export const WorkoutBuilder: React.FC<{ unitSystem: 'METRIC' | 'IMPERIAL' }> = ({ unitSystem }) => {
  const [sessionName, setSessionName] = useState('Upper Body Hypertrophy');
  const [exercises, setExercises] = useState<ExerciseBlock[]>([
    {
      exerciseId: 'ex_1',
      exerciseName: 'Barbell Bench Press',
      muscle: 'CHEST',
      sets: [
        { id: 's1', setNumber: 1, setType: 'WARMUP', weight: 60, reps: 10, rpe: 6, completed: true },
        { id: 's2', setNumber: 2, setType: 'NORMAL', weight: 85, reps: 8, rpe: 8, completed: true },
        { id: 's3', setNumber: 3, setType: 'NORMAL', weight: 95, reps: 5, rpe: 9, completed: true },
        { id: 's4', setNumber: 4, setType: 'NORMAL', weight: 100, reps: 3, rpe: 9.5, completed: true }
      ]
    },
    {
      exerciseId: 'ex_2',
      exerciseName: 'Overhead Military Press',
      muscle: 'SHOULDERS',
      sets: [
        { id: 's5', setNumber: 1, setType: 'NORMAL', weight: 50, reps: 8, rpe: 8, completed: true },
        { id: 's6', setNumber: 2, setType: 'NORMAL', weight: 55, reps: 6, rpe: 8.5, completed: false }
      ]
    }
  ]);

  const toggleSetComplete = (exIndex: number, setIndex: number) => {
    const next = [...exercises];
    next[exIndex].sets[setIndex].completed = !next[exIndex].sets[setIndex].completed;
    setExercises(next);
  };

  const addSet = (exIndex: number) => {
    const next = [...exercises];
    const prevSet = next[exIndex].sets[next[exIndex].sets.length - 1];
    next[exIndex].sets.push({
      id: `s_${Date.now()}`,
      setNumber: next[exIndex].sets.length + 1,
      setType: 'NORMAL',
      weight: prevSet ? prevSet.weight : 50,
      reps: prevSet ? prevSet.reps : 8,
      rpe: 8,
      completed: false
    });
    setExercises(next);
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const next = [...exercises];
    next[exIndex].sets.splice(setIndex, 1);
    // Re-index
    next[exIndex].sets.forEach((s, idx) => (s.setNumber = idx + 1));
    setExercises(next);
  };

  // Compute Volume Load: sum(weight * reps)
  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0)
    );
  }, 0);

  const weightUnit = unitSystem === 'IMPERIAL' ? 'lbs' : 'kg';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Live Workout Session
            </span>
          </div>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 mt-1"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Session Volume Load</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {totalVolume.toLocaleString()} <span className="text-sm font-normal text-slate-500">{weightUnit}</span>
            </div>
          </div>
          <button className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow flex items-center gap-2">
            <Check className="w-4 h-4" /> Finish Workout
          </button>
        </div>
      </div>

      {/* Exercise Blocks */}
      <div className="space-y-6">
        {exercises.map((block, exIndex) => (
          <div key={block.exerciseId} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{block.exerciseName}</h4>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{block.muscle}</span>
                </div>
              </div>
            </div>

            {/* Set Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-2 w-12 text-center">Set</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">{weightUnit.toUpperCase()}</th>
                    <th className="py-2 px-3">Reps</th>
                    <th className="py-2 px-3">RPE</th>
                    <th className="py-2 px-2 text-center w-16">Done</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {block.sets.map((s, setIndex) => (
                    <tr key={s.id} className={s.completed ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
                      <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {s.setNumber}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {s.setType}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) => {
                            const next = [...exercises];
                            next[exIndex].sets[setIndex].weight = Number(e.target.value);
                            setExercises(next);
                          }}
                          className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-semibold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => {
                            const next = [...exercises];
                            next[exIndex].sets[setIndex].reps = Number(e.target.value);
                            setExercises(next);
                          }}
                          className="w-14 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-semibold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.5"
                          value={s.rpe}
                          onChange={(e) => {
                            const next = [...exercises];
                            next[exIndex].sets[setIndex].rpe = Number(e.target.value);
                            setExercises(next);
                          }}
                          className="w-14 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-semibold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => toggleSetComplete(exIndex, setIndex)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            s.completed
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeSet(exIndex, setIndex)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => addSet(exIndex)}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <Plus className="w-3.5 h-3.5" /> Add Set
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
