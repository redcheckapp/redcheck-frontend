// Simple flat-design illustration for the dashboard's first-run welcome
// state — replaces the generic lucide `Sparkles` icon. A clipboard with a
// checkmark (echoes the app's own logo mark) plus a few accent dots, kept
// to flat geometric shapes rather than an attempt at a detailed scene.
export const WelcomeIllustration = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
        <rect x="28" y="16" width="64" height="88" rx="10" className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700" strokeWidth="2" />
        <rect x="46" y="8" width="28" height="14" rx="6" className="fill-gray-300 dark:fill-gray-600" />
        <rect x="40" y="40" width="40" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
        <rect x="40" y="52" width="30" height="5" rx="2.5" className="fill-gray-200 dark:fill-gray-700" />
        <circle cx="60" cy="78" r="20" className="fill-red-50 dark:fill-red-900/30" />
        <path d="M51 78l6 6 12-14" className="stroke-red-600 dark:stroke-red-400" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="20" cy="30" r="3" className="fill-amber-300 dark:fill-amber-700" />
        <circle cx="100" cy="90" r="4" className="fill-blue-300 dark:fill-blue-700" />
        <circle cx="95" cy="25" r="2.5" className="fill-green-300 dark:fill-green-700" />
    </svg>
);
