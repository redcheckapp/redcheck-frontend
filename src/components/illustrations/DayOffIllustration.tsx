// Simple flat-design illustration for Day view's empty state ("Day off!")
// — replaces the generic lucide CheckCircle2 icon used there before. A sun
// behind a drifting cloud, evoking "nothing scheduled, relax" — kept to flat
// geometric shapes rather than an attempt at a detailed scene, same approach
// as EmptyTrayIllustration/WelcomeIllustration.
export const DayOffIllustration = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
        <g className="stroke-amber-300 dark:stroke-amber-700" strokeWidth="4" strokeLinecap="round">
            <line x1="66" y1="12" x2="66" y2="22" />
            <line x1="94" y1="24" x2="87" y2="31" />
            <line x1="36" y1="20" x2="43" y2="29" />
            <line x1="24" y1="48" x2="34" y2="48" />
            <line x1="104" y1="48" x2="94" y2="48" />
        </g>
        <circle cx="66" cy="48" r="20" className="fill-amber-200 dark:fill-amber-800/60" />
        <path
            d="M18 96
               a14 14 0 0 1 13.5-14
               a17 17 0 0 1 33-4
               a12 12 0 0 1 15 11.6
               a11 11 0 0 1 -1 21.4
               H29
               a11 11 0 0 1 -11-15 Z"
            className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <circle cx="98" cy="88" r="3" className="fill-red-200 dark:fill-red-800" />
        <circle cx="16" cy="66" r="2.5" className="fill-blue-300 dark:fill-blue-700" />
        <circle cx="90" cy="20" r="2" className="fill-green-300 dark:fill-green-700" />
    </svg>
);
