import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

const Bomb = () => {
    throw new Error("boom");
};

describe("ErrorBoundary", () => {
    it("renders children normally when nothing throws", () => {
        render(
            <ErrorBoundary>
                <p>All good</p>
            </ErrorBoundary>
        );
        expect(screen.getByText("All good")).toBeInTheDocument();
    });

    it("shows a recoverable fallback instead of crashing when a child throws", () => {
        // React logs the caught error to the console on top of our own
        // componentDidCatch — expected noise for this test, not a real assertion target.
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );

        expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
        expect(screen.queryByText("All good")).not.toBeInTheDocument();

        consoleErrorSpy.mockRestore();
    });
});
