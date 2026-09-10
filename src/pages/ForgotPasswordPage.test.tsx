import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { forgotPassword } from "../api/authApi";

vi.mock("../api/authApi", () => ({
    forgotPassword: vi.fn(),
}));

const renderPage = () =>
    render(
        <MemoryRouter>
            <LanguageProvider>
                <ThemeProvider>
                    <ForgotPasswordPage />
                </ThemeProvider>
            </LanguageProvider>
        </MemoryRouter>
    );

describe("ForgotPasswordPage", () => {
    it("renders the request form without crashing", () => {
        renderPage();
        expect(screen.getByRole("button", { name: /send reset link|enviar enlace/i })).toBeInTheDocument();
    });

    it("submits the email and shows the generic success state", async () => {
        vi.mocked(forgotPassword).mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        const { container } = renderPage();

        const emailInput = container.querySelector<HTMLInputElement>('input[type="email"]')!;
        await user.type(emailInput, "ana@example.com");
        await user.click(screen.getByRole("button", { name: /send reset link|enviar enlace/i }));

        await waitFor(() => {
            expect(screen.getByText(/check your email|revisa tu correo/i)).toBeInTheDocument();
        });
        expect(forgotPassword).toHaveBeenCalledWith("ana@example.com", expect.any(String));
    });

    it("has a link back to the login page", () => {
        renderPage();
        const backLink = screen.getByRole("link", { name: /back to sign in|volver a iniciar sesión/i });
        expect(backLink).toHaveAttribute("href", "/login");
    });
});
