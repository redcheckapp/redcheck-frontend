import type { FontSize } from "../context/AccessibilityContext";

const SIZES: FontSize[] = ["small", "small-medium", "medium", "medium-large", "large"];

interface FontSizeSliderProps {
    value: FontSize;
    onChange: (value: FontSize) => void;
    ariaLabel: string;
    valueLabels: Record<FontSize, string>; // screen-reader only, via aria-valuetext
}

// A 5-position drag slider replacing the old 3-button small/medium/large
// chip row — a single circular thumb you drag (or arrow-key) along a line
// reads as more minimalist/premium than a row of buttons, and scales to 5
// steps without the cramped look a 5-button row would have. Built on a
// native <input type="range"> (free keyboard nav, touch dragging, and
// screen-reader semantics) with its own track/thumb fully stripped via the
// .rc-slider class (index.css) — the track/fill/ticks below are purely
// decorative, positioned to match the same 5 evenly-spaced stops the input
// itself snaps to.
export const FontSizeSlider = ({ value, onChange, ariaLabel, valueLabels }: FontSizeSliderProps) => {
    const index = Math.max(0, SIZES.indexOf(value));
    const percent = (index / (SIZES.length - 1)) * 100;

    return (
        <div className="flex items-center gap-3 px-1 py-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 select-none shrink-0" aria-hidden="true">A</span>
            <div className="relative flex-1 h-5 flex items-center">
                <div className="absolute inset-x-0 h-1 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300" />
                <div
                    className="absolute left-0 h-1 rounded-full bg-red-500 transition-[width] duration-150 ease-out"
                    style={{ width: `${percent}%` }}
                />
                <div className="absolute inset-x-0 flex justify-between">
                    {SIZES.map(size => (
                        <span
                            key={size}
                            className="w-1 h-1 rounded-full bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-600 transition-colors duration-300"
                        />
                    ))}
                </div>
                <input
                    type="range"
                    className="rc-slider relative z-10 w-full h-5 m-0 cursor-pointer"
                    min={0}
                    max={SIZES.length - 1}
                    step={1}
                    value={index}
                    onChange={e => onChange(SIZES[Number(e.target.value)])}
                    aria-label={ariaLabel}
                    aria-valuetext={valueLabels[value]}
                />
            </div>
            <span className="text-base text-gray-400 dark:text-gray-500 select-none shrink-0" aria-hidden="true">A</span>
        </div>
    );
};
