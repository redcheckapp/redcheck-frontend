import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Explicit rather than relying on Testing Library's auto-cleanup, which
// needs `test.globals: true` in the Vitest config to register itself —
// this project keeps globals off (explicit `import { describe, it, ... }
// from "vitest"` in every test file instead), so without this each test
// would render on top of the previous one's leftover DOM.
afterEach(() => {
    cleanup();
});

// jsdom doesn't implement matchMedia — ThemeContext calls it during its
// initial-state check (system dark-mode preference), so anything rendering
// that provider needs this stubbed or it throws.
if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

