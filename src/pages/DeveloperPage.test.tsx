import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import DeveloperPage from "./DeveloperPage";
import { getAdminFeedback, getAiUsage, getSystemStatus, getUserStats, notifyFeedbackAuthor, updateAdminFeedback } from "../api/adminApi";
import type { AdminFeedback, AiUsageStats, SystemStatus, UserStats } from "../types";

vi.mock("../api/adminApi", () => ({
    getAdminFeedback: vi.fn(),
    getAiUsage: vi.fn(),
    updateAdminFeedback: vi.fn(),
    notifyFeedbackAuthor: vi.fn(),
    getUserStats: vi.fn(),
    getSystemStatus: vi.fn(),
}));

const userStats: UserStats = {
    days: 30,
    totalUsers: 137,
    googleUsers: 20,
    newUsers: 9,
    seenToday: 11,
    seen7d: 31,
    seen30d: 62,
    acting7d: 23,
    acting30d: 47,
    daily: [
        { date: "2026-10-16", actingUsers: 5, signups: 1 },
        { date: "2026-10-17", actingUsers: 7, signups: 0 },
    ],
};

const system: SystemStatus = {
    version: "0.0.1-SNAPSHOT",
    buildTime: "2026-10-17T10:00:00Z",
    gitSha: "abc1234def5678",
    startedAt: "2026-10-17T10:05:00Z",
    uptimeSeconds: 7260,
    javaVersion: "17.0.12",
    memoryUsedMb: 180,
    memoryMaxMb: 512,
    aiEngineReachable: false,
    aiEngineLatencyMs: null,
};

const usage: AiUsageStats = {
    days: 30,
    todayPrioritizeCalls: 3,
    totalPrioritizeCalls: 42,
    totalOutcomeCalls: 10,
    failedCalls: 2,
    avgPrioritizeDurationMs: 4200,
    distinctUsers: 5,
    daily: [
        { date: "2026-10-16", prioritizeCalls: 1, outcomeCalls: 0, failedCalls: 0 },
        { date: "2026-10-17", prioritizeCalls: 3, outcomeCalls: 2, failedCalls: 1 },
    ],
};

const newFeedback: AdminFeedback = {
    id: 1,
    category: "BUG",
    status: "NEW",
    message: "The calendar doesn't load",
    adminNote: null,
    createdDate: "2026-10-17T10:00:00",
    userNotifiedDate: null,
    userEmail: "ana@example.com",
    userAlias: "ana",
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <LanguageProvider>
                <ThemeProvider>
                    <DeveloperPage />
                </ThemeProvider>
            </LanguageProvider>
        </MemoryRouter>
    );

describe("DeveloperPage", () => {
    beforeEach(() => {
        localStorage.setItem("token", "test-token");
        vi.mocked(getAiUsage).mockResolvedValue(usage);
        vi.mocked(getAdminFeedback).mockResolvedValue([newFeedback]);
        vi.mocked(getUserStats).mockResolvedValue(userStats);
        vi.mocked(getSystemStatus).mockResolvedValue(system);
    });

    it("renders the user KPIs, with stickiness as active 7d over active 30d", async () => {
        renderPage();

        expect(await screen.findByText("137")).toBeInTheDocument();
        expect(screen.getByText("47")).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument(); // 31 / 62
    });

    it("shows which build is running and flags an unreachable AI engine", async () => {
        renderPage();

        expect((await screen.findAllByText(/commit abc1234/))[0]).toBeInTheDocument();
        // Both the header chip and the System section flag it.
        expect(screen.getAllByText(/not responding|sin respuesta/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/2h 1m/)).toBeInTheDocument();
    });

    it("renders the AI usage KPIs and the feedback inbox", async () => {
        renderPage();

        expect(await screen.findByText("42")).toBeInTheDocument();
        expect(screen.getByText("4.2 s")).toBeInTheDocument();
        expect(screen.getAllByText("The calendar doesn't load")[0]).toBeInTheDocument();
        expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    });

    it("marks a new entry as seen when it's opened", async () => {
        vi.mocked(updateAdminFeedback).mockResolvedValueOnce({ ...newFeedback, status: "SEEN" });
        const user = userEvent.setup();
        renderPage();

        await user.click((await screen.findAllByText("The calendar doesn't load"))[0]);

        expect(updateAdminFeedback).toHaveBeenCalledWith(1, { status: "SEEN" });
    });

    it("sends the author an in-app notification with the prefilled message", async () => {
        vi.mocked(updateAdminFeedback).mockResolvedValueOnce({ ...newFeedback, status: "SEEN" });
        vi.mocked(notifyFeedbackAuthor).mockResolvedValueOnce({ ...newFeedback, status: "SEEN", userNotifiedDate: "2026-10-17T12:00:00" });
        const user = userEvent.setup();
        renderPage();

        await user.click((await screen.findAllByText("The calendar doesn't load"))[0]);
        await user.click(screen.getByRole("button", { name: /send notification|enviar notificación/i }));

        expect(notifyFeedbackAuthor).toHaveBeenCalledWith(1, expect.stringMatching(/thanks|gracias/i), false, expect.any(String));
        expect(await screen.findByText(/notified on|notificado el/i)).toBeInTheDocument();
    });

    it("shows the saved internal note on a collapsed row, and hides it once expanded", async () => {
        vi.mocked(getAdminFeedback).mockResolvedValueOnce([{ ...newFeedback, status: "SEEN", adminNote: "Repro on Safari only" }]);
        const user = userEvent.setup();
        renderPage();

        expect((await screen.findAllByText("Repro on Safari only"))[0]).toBeInTheDocument();
        expect(screen.getByText(/internal note:|nota interna:/i)).toBeInTheDocument();

        // Collapsed sections stay mounted (so closing can animate), hidden via aria-hidden.
        const notePreview = () => screen.getByText(/internal note:|nota interna:/i).closest("[aria-hidden]");
        expect(notePreview()).toHaveAttribute("aria-hidden", "false");

        await user.click(screen.getAllByText("The calendar doesn't load")[0]);
        expect(notePreview()).toHaveAttribute("aria-hidden", "true");

        await user.click(screen.getByRole("button", { name: /^(close|cerrar)$/i }));
        expect(notePreview()).toHaveAttribute("aria-hidden", "false");
    });

    it("labels a build without a commit as a local build, not 'unknown'", async () => {
        vi.mocked(getSystemStatus).mockResolvedValueOnce({ ...system, gitSha: "unknown", aiEngineReachable: true, aiEngineLatencyMs: 12 });
        renderPage();

        expect((await screen.findAllByText(/local build|build local/i))[0]).toBeInTheDocument();
        expect(screen.queryByText(/· (unknown|desconocido)$/i)).not.toBeInTheDocument();
    });

        it("shows a no-access screen when the backend answers 403", async () => {
        const forbidden = new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
            status: 403, statusText: "Forbidden", data: null, headers: {}, config: { headers: new AxiosHeaders() },
        });
        vi.mocked(getAiUsage).mockRejectedValueOnce(forbidden);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/no access|sin acceso/i)).toBeInTheDocument();
        });
    });
});
