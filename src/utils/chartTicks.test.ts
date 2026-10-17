import { describe, it, expect } from "vitest";
import { axisTicks } from "./chartTicks";

describe("axisTicks", () => {
    it("never repeats or misplaces the middle label", () => {
        expect(axisTicks(1)).toEqual([1, 0]);
        expect(axisTicks(0)).toEqual([1, 0]);
        expect(axisTicks(5)).toEqual([5, 0]);
        expect(axisTicks(2)).toEqual([2, 1, 0]);
        expect(axisTicks(7)).toEqual([8, 4, 0]);
        expect(axisTicks(23)).toEqual([25, 0]);
        expect(axisTicks(37)).toEqual([40, 20, 0]);
    });
});
