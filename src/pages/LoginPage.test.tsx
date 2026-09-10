import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import LoginPage from "./LoginPage";

vi.mock("../api/authApi", () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
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

    it("lets the user type into the identifier and password fields", async () => {
        const user = userEvent.setup();
        const { container } = renderLoginPage();

        const identifierInput = container.querySelector<HTMLInputElement>('input[name="emailOrUsername"]')!;
        const passwordInput = container.querySelector<HTMLInputElement>('input[name="password"]')!;

        await user.type(identifierInput, "ana@example.com");
        await user.type(passwordInput, "hunter2");

        expect(identifierInput).toHaveValue("ana@example.com");
        expect(passwordInput).toHaveValue("hunter2");
    });

    it("has a link to the register page", () => {
        renderLoginPage();
        const registerLink = screen.getByRole("link", { name: /register here|regístrate aquí/i });
        expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("does not render the Google sign-in section when no client id is configured", () => {
        renderLoginPage();
        expect(screen.queryByText(/or continue with|o continúa con/i)).not.toBeInTheDocument();
    });

    // GOOGLE_SIGN_IN_ENABLED is temporarily hardcoded to false in LoginPage.tsx
    // (Google Cloud's OAuth consent screen is stuck on "requires verification"
    // — see that file's comment), so the section stays hidden even with a
    // client id configured. Once that's flipped back to true, this test
    // should go back to asserting the section IS rendered here.
    it("does not render the Google sign-in section even with a client id configured, while sign-in is disabled", async () => {
        vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
        vi.resetModules();

        // LoginPage reads the client id at module-load time, so both it and
        // its context providers must be re-imported fresh after stubbing the
        // env var — otherwise LoginPage's freshly re-imported LanguageContext
        // module wouldn't be the same one the statically-imported provider
        // above renders, and useLanguage() would find no matching provider.
        const { default: FreshLoginPage } = await import("./LoginPage");
        const { LanguageProvider: FreshLanguageProvider } = await import("../context/LanguageContext");
        const { ThemeProvider: FreshThemeProvider } = await import("../context/ThemeContext");

        render(
            <MemoryRouter>
                <FreshLanguageProvider>
                    <FreshThemeProvider>
                        <FreshLoginPage />
                    </FreshThemeProvider>
                </FreshLanguageProvider>
            </MemoryRouter>
        );

        expect(screen.queryByText(/or continue with|o continúa con/i)).not.toBeInTheDocument();

        vi.unstubAllEnvs();
        vi.resetModules();
    });
});
