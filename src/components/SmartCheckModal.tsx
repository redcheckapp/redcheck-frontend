import React from 'react';
import type { SubjectWithTasks } from '../types';

interface SmartCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiData: any;
  subjects: SubjectWithTasks[];
}

const getRiskConfig = (nivel: string) => {
  switch (nivel?.toUpperCase()) {
    case 'ALTO':  return { label: 'ALTO 🔥',  className: 'bg-red-50 text-red-600 border border-red-200' };
    case 'MEDIO': return { label: 'MEDIO ⚠️', className: 'bg-orange-50 text-orange-600 border border-orange-200' };
    case 'BAJO':  return { label: 'BAJO ✅',  className: 'bg-green-50 text-green-600 border border-green-200' };
    default:      return { label: nivel,       className: 'bg-zinc-100 text-zinc-600 border border-zinc-200' };
  }
};

const SmartCheckModal: React.FC<SmartCheckModalProps> = ({ isOpen, onClose, aiData, subjects }) => {
  if (!isOpen || !aiData) return null;

  const risk = getRiskConfig(aiData.nivelRiesgo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden"
        style={{ maxHeight: '88vh' }}
      >

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          {/* Risk badge */}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${risk.className}`}>
            Riesgo: {risk.label}
          </span>
        </div>

        {/* ── CENTERED TITLE ── */}
        <div className="text-center px-6 pb-4">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Plan Diario SmartCheck 🧠
          </h2>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 flex flex-col gap-5">

          {/* Support message */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3 items-start">
            <span className="text-lg leading-none mt-0.5">🧠</span>
            <p className="text-sm text-blue-800 font-medium leading-relaxed m-0">
              ✨ {aiData.mensajeApoyo}
            </p>
          </div>

          {/* Section subtitle */}
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest m-0">
            Tu estrategia para hoy
          </h3>

          {/* Task cards */}
          <div className="flex flex-col gap-3">
            {aiData.planDeHoy
              ?.sort((a: any, b: any) => a.ordenDefinido - b.ordenDefinido)
              .map((itemIA: any) => {
                let tareaReal = null;
                let nombreAsignatura = '';

                for (const subject of subjects) {
                  const found = subject.tasks.find(t => t.id === itemIA.id);
                  if (found) {
                    tareaReal = found;
                    nombreAsignatura = subject.name;
                    break;
                  }
                }

                if (!tareaReal) return null;

                return (
                  <div
                    key={itemIA.id}
                    className="flex gap-4 items-start bg-zinc-50 border border-zinc-200 rounded-xl p-4"
                  >
                    {/* Number */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 text-white text-sm font-bold flex items-center justify-center">
                      {itemIA.ordenDefinido}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 m-0 leading-snug">
                        {tareaReal.title}
                      </p>
                      <p className="text-xs text-zinc-400 font-medium m-0">
                        Asignatura: {nombreAsignatura}
                      </p>

                      {/* Priority reason */}
                      <div className="mt-2 bg-white border border-zinc-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-zinc-500 italic m-0 leading-relaxed">
                          ✨ {itemIA.razonPrioridad}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-colors"
          >
            ¡A por ello!
          </button>
        </div>

      </div>
    </div>
  );
};

export default SmartCheckModal;