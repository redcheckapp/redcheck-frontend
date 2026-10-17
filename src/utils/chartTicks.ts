// Y-axis labels, top to bottom. The top is the next "nice" integer at or
// above the max. The middle label sits on the 50% gridline, so it's only
// shown when top/2 is a whole number: rounding it (as before) labelled the
// middle of a 0–1 axis "1" and the middle of a 0–5 axis "3".
export const axisTicks = (max: number): number[] => {
    const safeMax = Math.max(1, max);
    const step = safeMax <= 5 ? 1 : safeMax <= 10 ? 2 : Math.ceil(safeMax / 5 / 5) * 5;
    const top = Math.ceil(safeMax / step) * step;
    return top % 2 === 0 ? [top, top / 2, 0] : [top, 0];
};
