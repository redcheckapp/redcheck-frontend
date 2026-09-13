// A classic sliding-knob switch for true on/off settings — extracted out
// of SettingsModal.tsx (its original home) once CalendarEventModal.tsx
// needed the same widget for "All day"/"Repeats", rather than duplicating
// it or reaching for a plain <input type="checkbox">, which reads as
// noticeably cheaper/less polished than the rest of this app's controls.
export const ToggleSwitch = ({ enabled, onToggle, title }: { enabled: boolean; onToggle: () => void; title: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        title={title}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${enabled ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
    </button>
);
