import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Star } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

// A bare-bones action set is enough to exercise keyboard navigation —
// subjects/tasks results only appear once the search query is non-empty
// (see CommandPalette.tsx), so leaving `subjects` empty and the query
// untouched keeps flatItems == actions, letting the test assert on
// *which action fired* rather than inspecting highlight CSS classes.
const renderPalette = (onSelectA: () => void, onSelectB: () => void, onSelectC: () => void) =>
    render(
        <CommandPalette
            isOpen={true}
            onClose={() => {}}
            actions={[
                { id: "a", label: "Action A", icon: Star, onSelect: onSelectA },
                { id: "b", label: "Action B", icon: Star, onSelect: onSelectB },
                { id: "c", label: "Action C", icon: Star, onSelect: onSelectC },
            ]}
            subjects={[]}
            onSelectTask={() => {}}
            onSelectSubject={() => {}}
            placeholder="Search..."
            subjectsGroupLabel="Subjects"
            tasksGroupLabel="Tasks"
            actionsGroupLabel="Actions"
            emptyLabel="No results"
            taskCountOneLabel="task"
            taskCountManyLabel="tasks"
            moreTasksLabel="more"
        />
    );

describe("CommandPalette keyboard navigation", () => {
    it("wraps from the first item to the last on ArrowUp", async () => {
        const user = userEvent.setup();
        const onSelectA = vi.fn();
        const onSelectB = vi.fn();
        const onSelectC = vi.fn();
        renderPalette(onSelectA, onSelectB, onSelectC);

        const input = screen.getByPlaceholderText("Search...");
        await user.click(input);
        await user.keyboard("{ArrowUp}");
        await user.keyboard("{Enter}");

        expect(onSelectC).toHaveBeenCalledTimes(1);
        expect(onSelectA).not.toHaveBeenCalled();
        expect(onSelectB).not.toHaveBeenCalled();
    });

    it("wraps from the last item back to the first on ArrowDown", async () => {
        const user = userEvent.setup();
        const onSelectA = vi.fn();
        const onSelectB = vi.fn();
        const onSelectC = vi.fn();
        renderPalette(onSelectA, onSelectB, onSelectC);

        const input = screen.getByPlaceholderText("Search...");
        await user.click(input);
        // 0 -> 1 -> 2 -> 0 (wraps past the last item)
        await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
        await user.keyboard("{Enter}");

        expect(onSelectA).toHaveBeenCalledTimes(1);
        expect(onSelectB).not.toHaveBeenCalled();
        expect(onSelectC).not.toHaveBeenCalled();
    });

    it("still moves normally (no wrap) for a middle step", async () => {
        const user = userEvent.setup();
        const onSelectA = vi.fn();
        const onSelectB = vi.fn();
        const onSelectC = vi.fn();
        renderPalette(onSelectA, onSelectB, onSelectC);

        const input = screen.getByPlaceholderText("Search...");
        await user.click(input);
        await user.keyboard("{ArrowDown}");
        await user.keyboard("{Enter}");

        expect(onSelectB).toHaveBeenCalledTimes(1);
        expect(onSelectA).not.toHaveBeenCalled();
        expect(onSelectC).not.toHaveBeenCalled();
    });
});
