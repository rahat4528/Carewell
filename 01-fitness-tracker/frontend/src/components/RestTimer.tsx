'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, Volume2 } from 'lucide-react';

export const RestTimer: React.FC = () => {
  const [totalSeconds, setTotalSeconds] = useState<number>(90); // default 90s rest
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const targetEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && targetEndTimeRef.current) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current! - Date.now()) / 1000));
        setSecondsRemaining(remaining);

        if (remaining <= 0) {
          setIsRunning(false);
          targetEndTimeRef.current = null;
          playChime();
        }
      }, 200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio notification played');
    }
  };

  const startTimer = () => {
    targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
  };

  const resetTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setSecondsRemaining(totalSeconds);
  };

  const adjustTime = (delta: number) => {
    const updated = Math.max(10, secondsRemaining + delta);
    setSecondsRemaining(updated);
    if (isRunning) {
      targetEndTimeRef.current = Date.now() + updated * 1000;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg border border-slate-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm tracking-wide uppercase text-slate-300">Rest Timer</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Audio chime</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-3xl font-extrabold tracking-tight font-mono text-emerald-400">
          {formatTime(secondsRemaining)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustTime(-15)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="-15 seconds"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => adjustTime(30)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="+30 seconds"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isRunning ? (
            <button
              onClick={pauseTimer}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 text-sm font-semibold"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5 text-sm font-semibold shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" /> Start
            </button>
          )}
          <button
            onClick={resetTimer}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
