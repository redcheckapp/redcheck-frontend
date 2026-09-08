import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import LoginPage from "./LoginPage";

vi.mock("../api/authApi", () => ({
    login: vi.fn(),
}));

const renderLoginPage = () =>
    render(
        <MemoryRouter>
            <LanguageProvider>
                <ThemeProvider>
                    <LoginPage />
                </ThemeProvider>
            </LanguageProvider>
        </MemoryRouter>
    );

describe("LoginPage", () => {
    it("renders the sign-in form without crashing", () => {
        renderLoginPage();
        expect(screen.getByRole("button", { name: /log in to redcheck|entrar a redcheck/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^demo$/i })).toBeInTheDocument();
    });

    it("lets the user type into the email and password fields", async () => {
        const user = userEvent.setup();
        const { container } = renderLoginPage();

        // The email/password inputs aren't associated with their <label> via
        // htmlFor/id, so they have no accessible name for getByRole/getByLabelText —
        // that's a pre-existing accessibility gap, not something to work around silently.
        const emailInput = container.querySelector<HTMLInputElement>('input[name="email"]')!;
        const passwordInput = container.querySelector<HTMLInputElement>('input[name="password"]')!;

        await user.type(emailInput, "ana@example.com");
        await user.type(passwordInput, "hunter2");

        expect(emailInput).toHaveValue("ana@example.com");
        expect(passwordInput).toHaveValue("hunter2");
    });

    it("has a link to the register page", () => {
        renderLoginPage();
        const registerLink = screen.getByRole("link", { name: /register here|regístrate aquí/i });
        expect(registerLink).toHaveAttribute("href", "/register");
    });
});
