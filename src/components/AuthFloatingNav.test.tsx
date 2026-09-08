import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthFloatingNav } from "./AuthFloatingNav";

// AuthFloatingNav reads theme/language, so it needs both providers —
// jsdom doesn't evaluate the `hidden sm:flex` media-query classes, so both
// the mobile-row and floating copies of each control are present in the
// DOM regardless of viewport; tests assert on both via getAllByRole.
const renderWithProviders = (ui: React.ReactNode) =>
    render(
        <LanguageProvider>
            <ThemeProvider>{ui}</ThemeProvider>
        </LanguageProvider>
    );

describe("AuthFloatingNav", () => {
    it("renders a link pointing at backHref when given one", () => {
        renderWithProviders(
            <AuthFloatingNav backHref="https://redcheckapp.com" backAriaLabel="Back to redcheckapp.com" />
        );

        const links = screen.getAllByRole("link", { name: "Back to redcheckapp.com" });
        expect(links.length).toBeGreaterThan(0);
        links.forEach((link) => expect(link).toHaveAttribute("href", "https://redcheckapp.com"));
    });

    it("renders a button calling onBack when no backHref is given", () => {
        const handleBack = vi.fn();
        renderWithProviders(<AuthFloatingNav onBack={handleBack} backAriaLabel="Back" />);

        const buttons = screen.getAllByRole("button", { name: "Back" });
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons[0]).not.toHaveAttribute("href");
    });

    it("also renders the language and theme toggle buttons", () => {
        renderWithProviders(<AuthFloatingNav onBack={() => {}} backAriaLabel="Back" />);

        expect(screen.getAllByTitle(/switch to english|cambiar a español/i).length).toBeGreaterThan(0);
        expect(screen.getAllByTitle(/cambiar tema|toggle theme/i).length).toBeGreaterThan(0);
    });
});
