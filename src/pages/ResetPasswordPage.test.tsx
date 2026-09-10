import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import ResetPasswordPage from "./ResetPasswordPage";
import { resetPassword } from "../api/authApi";

vi.mock("../api/authApi", () => ({
    resetPassword: vi.fn(),
}));

const renderPage = (initialPath: string) =>
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <LanguageProvider>
                <ThemeProvider>
                    <ResetPasswordPage />
                </ThemeProvider>
            </LanguageProvider>
        </MemoryRouter>
    );

describe("ResetPasswordPage", () => {
    it("shows an invalid-link state when there's no token in the URL", () => {
        renderPage("/reset-password");
        expect(screen.getByText(/invalid link|enlace no válido/i)).toBeInTheDocument();
    });

    it("renders the reset form when a token is present", () => {
        renderPage("/reset-password?token=abc123");
        expect(screen.getByRole("button", { name: /reset password|restablecer contraseña/i })).toBeInTheDocument();
    });

    it("rejects mismatched passwords client-side without calling the API", async () => {
        const user = userEvent.setup();
        const { container } = renderPage("/reset-password?token=abc123");

        const inputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
        await user.type(inputs[0], "newPassword123");
        await user.type(inputs[1], "somethingElse123");
        await user.click(screen.getByRole("button", { name: /reset password|restablecer contraseña/i }));

        expect(screen.getByText(/don't match|no coinciden/i)).toBeInTheDocument();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("submits matching passwords and shows the success state", async () => {
        vi.mocked(resetPassword).mockResolvedValueOnce(undefined);
        const user = userEvent.setup();
        const { container } = renderPage("/reset-password?token=abc123");

        const inputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
        await user.type(inputs[0], "newPassword123");
        await user.type(inputs[1], "newPassword123");
        await user.click(screen.getByRole("button", { name: /reset password|restablecer contraseña/i }));

        await waitFor(() => {
            expect(screen.getByText(/password updated|contraseña actualizada/i)).toBeInTheDocument();
        });
        expect(resetPassword).toHaveBeenCalledWith("abc123", "newPassword123");
    });
});
