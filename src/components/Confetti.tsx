import { useEffect, useState, type CSSProperties } from "react";

interface ConfettiPiece {
    id: number;
    left: number;
    color: string;
    delay: number;
    duration: number;
    rotation: number;
}

const COLORS = ["#cc2229", "#16a34a", "#2563eb", "#f59e0b", "#9333ea"];
const PIECE_COUNT = 24;
const LIFETIME_MS = 2200;

const makeBurst = (): ConfettiPiece[] =>
    Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 0.6,
        rotation: Math.random() * 360,
    }));

// A small, dependency-free confetti burst — a handful of colored squares
// falling with a CSS keyframe, not a canvas/library. Bump `trigger` (any
// changing number) to fire a new burst; it unmounts itself afterward.
export const Confetti = ({ trigger }: { trigger: number }) => {
    const [pieces, setPieces] = useState<ConfettiPiece[] | null>(null);
    const [lastTrigger, setLastTrigger] = useState(trigger);

    // Render-phase update (not inside the effect below) — mirrors the
    // shouldRender/isVisible pattern in ModalOverlay: compare against state,
    // not a ref, so this stays within React's rules for render-phase updates.
    if (trigger !== lastTrigger) {
        setLastTrigger(trigger);
        if (trigger !== 0) {
            setPieces(makeBurst());
        }
    }

    useEffect(() => {
        if (!pieces) return;
        const timer = setTimeout(() => setPieces(null), LIFETIME_MS);
        return () => clearTimeout(timer);
    }, [pieces]);

    if (!pieces) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
            {pieces.map((p) => (
                <span
                    key={p.id}
                    className="absolute top-0 w-2 h-2 rounded-sm animate-confetti-fall"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        "--rot-start": `${p.rotation}deg`,
                        "--rot-end": `${p.rotation + 720}deg`,
                    } as CSSProperties}
                />
            ))}
        </div>
    );
};
