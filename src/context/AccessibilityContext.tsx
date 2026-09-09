import { createContext, useContext, useEffect, useState } from 'react';
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
// 5 steps (not 3) so there's a step between small/medium and between
// medium/large — see FontSizeSlider.tsx, the drag control built for this.
export type FontSize = 'small' | 'small-medium' | 'medium' | 'medium-large' | 'large';

interface AccessibilityContextType {
    colorblindMode: ColorblindMode;
    setColorblindMode: (mode: ColorblindMode) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const isColorblindMode = (v: string | null): v is ColorblindMode =>
    v === 'none' || v === 'protanopia' || v === 'deuteranopia' || v === 'tritanopia';

const isFontSize = (v: string | null): v is FontSize =>
    v === 'small' || v === 'small-medium' || v === 'medium' || v === 'medium-large' || v === 'large';

// Same priority chain and dual-persistence (shared cookie + localStorage)
// as ThemeContext/LanguageContext — these are the same tier of setting
// (whole-app visual preference), so they follow the same pattern rather
// than the simpler single-localStorage-key one DashboardPage's own opt-in
// toggles (remindersEnabled/taskFeedbackEnabled) use.
export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
    const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>(() => {
        const cookieValue = getSharedCookie('rc_colorblind_mode');
        if (isColorblindMode(cookieValue)) return cookieValue;
        const storedValue = localStorage.getItem('rc_colorblind_mode');
        if (isColorblindMode(storedValue)) return storedValue;
        // No system-preference equivalent to fall back to (unlike theme's
        // prefers-color-scheme) — colorblindness type isn't something a
        // browser/OS setting exposes, so "none" is the only sane default.
        return 'none';
    });

    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        const cookieValue = getSharedCookie('rc_font_size');
        if (isFontSize(cookieValue)) return cookieValue;
        const storedValue = localStorage.getItem('rc_font_size');
        if (isFontSize(storedValue)) return storedValue;
        return 'medium';
    });

    useEffect(() => {
        // Applied to `document.body`, not `documentElement` (`<html>`) —
        // `filter: url(#svg-filter-id)` on the root `<html>` element is
        // unreliable across browsers in practice, `body` is the far more
        // commonly proven-working target for this exact technique. This
        // still covers content portaled into `document.body` (every
        // ModalOverlay-based modal, see ModalOverlay.tsx): a portal's
        // content becomes a DOM *child* of body, which inherits the filter
        // like any other descendant — nothing is lost by not using `html`.
        const body = window.document.body;

        body.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia');
        if (colorblindMode !== 'none') {
            body.classList.add(`cb-${colorblindMode}`);
        }

        localStorage.setItem('rc_colorblind_mode', colorblindMode);
        setSharedCookie('rc_colorblind_mode', colorblindMode);
    }, [colorblindMode]);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('text-scale-small', 'text-scale-small-medium', 'text-scale-medium-large', 'text-scale-large');
        if (fontSize !== 'medium') {
            root.classList.add(`text-scale-${fontSize}`);
        }

        localStorage.setItem('rc_font_size', fontSize);
        setSharedCookie('rc_font_size', fontSize);
    }, [fontSize]);

    return (
        <AccessibilityContext.Provider
            value={{
                colorblindMode,
                setColorblindMode: setColorblindModeState,
                fontSize,
                setFontSize: setFontSizeState,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider by design
export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
