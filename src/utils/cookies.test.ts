import { describe, it, expect, beforeEach } from "vitest";
import { getSharedCookie, setSharedCookie } from "./cookies";

// Clears every cookie jsdom is holding between tests, since document.cookie
// otherwise leaks state across test cases in the same run.
const clearAllCookies = () => {
    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
    });
};

describe("getSharedCookie", () => {
    beforeEach(clearAllCookies);

    it("returns null for a cookie that was never set", () => {
        expect(getSharedCookie("rc_theme")).toBeNull();
    });

    it("round-trips a plain value written via setSharedCookie", () => {
        setSharedCookie("rc_theme", "dark");
        expect(getSharedCookie("rc_theme")).toBe("dark");
    });

    it("decodes a value containing reserved characters", () => {
        setSharedCookie("rc_note", "a;b=c d");
        expect(getSharedCookie("rc_note")).toBe("a;b=c d");
    });

    it("only matches the exact cookie name, not a prefix", () => {
        setSharedCookie("rc_theme_extra", "other");
        expect(getSharedCookie("rc_theme")).toBeNull();
    });
});
