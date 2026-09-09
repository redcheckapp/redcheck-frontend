import React from 'react';
import { Sparkles } from 'lucide-react';
import type { SmartCheckAiData, SubjectWithTasks } from '../types';
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { ModalOverlay } from "./ModalOverlay";

interface SmartCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiData: SmartCheckAiData | null;
  subjects: SubjectWithTasks[];
}

// --- Translation dictionary for the SmartCheckModal ---
const translations = {
    es: {
        riskLevel: "Riesgo",
        high: "ALTO",
        medium: "MEDIO",
        low: "BAJO",
        modalTitle: "Plan Diario SmartCheck",
        strategyTitle: "Tu estrategia para hoy",
        subjectLabel: "Asignatura",
        closeBtn: "¡A por ello!"
    },
    en: {
        riskLevel: "Risk",
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW",
        modalTitle: "SmartCheck Daily Plan",
        strategyTitle: "Your strategy for today",
        subjectLabel: "Subject",
        closeBtn: "Let's do this!"
    }
};

// We pass the translation dictionary (t) to translate the label
const getRiskConfig = (nivel: string, t: typeof translations['es']) => {
  switch (nivel?.toUpperCase()) {
    case 'ALTO':
    case 'HIGH':
        return { label: t.high,  className: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' };
    case 'MEDIO':
    case 'MEDIUM':
        return { label: t.medium, className: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50' };
    case 'BAJO':
    case 'LOW':
        return { label: t.low,  className: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50' };
    default:      
        return { label: nivel,       className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' };
  }
};

const SmartCheckModal: React.FC<SmartCheckModalProps> = ({ isOpen, onClose, aiData, subjects }) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations];

  if (!aiData) return null;

  const risk = getRiskConfig(aiData.nivelRiesgo, t);

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} backdropClassName="bg-black/60">
      {(isVisible) => (
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        style={{ maxHeight: '88vh' }}
      >

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors duration-300 ${risk.className}`}>
            {t.riskLevel}: {risk.label}
          </span>
        </div>

        {/* ── CENTERED TITLE ── */}
        <div className="text-center px-6 pb-4 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
            {t.modalTitle}
          </h2>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 flex flex-col gap-5">

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl px-4 py-3 flex gap-3 items-start transition-colors duration-300">
            <Sparkles size={18} className="shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed m-0 transition-colors duration-300">
              {aiData.mensajeApoyo}
            </p>
          </div>

          <h3 className="text-sm font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-widest m-0 transition-colors duration-300">
            {t.strategyTitle}
          </h3>

          <div className="flex flex-col gap-3">
            {aiData.planDeHoy
              ?.sort((a, b) => a.ordenDefinido - b.ordenDefinido)
              .map((itemIA) => {
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
                    className="flex gap-4 items-start bg-zinc-50 dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-xl p-4 transition-colors duration-300"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-bold flex items-center justify-center transition-colors duration-300">
                      {itemIA.ordenDefinido}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-gray-100 m-0 leading-snug transition-colors duration-300">
                        {tareaReal.title}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-gray-500 font-medium m-0 transition-colors duration-300">
                        {t.subjectLabel}: {nombreAsignatura}
                      </p>

                      <div className="mt-2 bg-white dark:bg-gray-900/50 border border-zinc-100 dark:border-gray-800/50 rounded-lg px-3 py-2 transition-colors duration-300">
                        <p className="text-xs text-zinc-500 dark:text-gray-400 italic m-0 leading-relaxed transition-colors duration-300">
                          {itemIA.razonPrioridad}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-gray-800 bg-zinc-50 dark:bg-gray-900/80 transition-colors duration-300">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-900 dark:bg-gray-200 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-sm rounded-xl transition-colors duration-300 shadow-sm"
          >
            {t.closeBtn}
          </button>
        </div>

      </div>
      )}
    </ModalOverlay>
  );
};

export default SmartCheckModal;