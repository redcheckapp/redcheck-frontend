// Simple flat-design illustration for the empty-trash state — replaces the
// generic lucide `Inbox` icon. Deliberately geometric (a few flat shapes,
// no complex paths) rather than an attempt at a detailed scene, since that's
// what holds up well when hand-coded as SVG rather than drawn by a designer.
export const EmptyTrayIllustration = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
        <path d="M20 55 L100 55 L92 48 L28 48 Z" className="fill-gray-100 dark:fill-gray-800" />
        <path
            d="M14 58 L106 58 L98 96 Q97 100 93 100 L27 100 Q23 100 22 96 Z"
            className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="2"
        />
        <rect x="10" y="52" width="100" height="10" rx="5" className="fill-gray-200 dark:fill-gray-700" />
        <circle cx="35" cy="34" r="2.5" className="fill-gray-300 dark:fill-gray-600" />
        <circle cx="85" cy="30" r="3.5" className="fill-red-200 dark:fill-red-800" />
        <circle cx="60" cy="24" r="2" className="fill-gray-300 dark:fill-gray-600" />
    </svg>
);
