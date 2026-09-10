import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "../context/LanguageContext";
import { PasswordInput } from "./PasswordInput";

const renderInput = () =>
    render(
        <LanguageProvider>
            <PasswordInput value="hunter2" onChange={() => {}} />
        </LanguageProvider>
    );

describe("PasswordInput", () => {
    it("renders masked by default", () => {
        const { container } = renderInput();
        const input = container.querySelector("input")!;
        expect(input).toHaveAttribute("type", "password");
    });

    it("reveals and re-hides the value when the toggle is clicked", async () => {
        const user = userEvent.setup();
        const { container } = renderInput();
        const input = container.querySelector("input")!;
        const toggle = screen.getByRole("button");

        await user.click(toggle);
        expect(input).toHaveAttribute("type", "text");

        await user.click(toggle);
        expect(input).toHaveAttribute("type", "password");
    });
});
