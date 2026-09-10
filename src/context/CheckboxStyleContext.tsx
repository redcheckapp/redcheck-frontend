import { createContext, useContext, useEffect, useState } from 'react';
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

// "legacy" (sharp square) is the shape every task checkbox actually had
// before a typo'd `squared-full` class (a no-op — not a real Tailwind
// utility) silently left it unrounded; it's kept as the default here so a
// returning user's checkboxes look exactly as they always have, with
// "circle" (what the typo fix accidentally introduced) and "soft" offered
// as opt-in alternatives rather than the new default.
export type CheckboxStyle = 'legacy' | 'soft' | 'circle';

// The glyph shown inside a checked completion checkbox — a second,
// independent personalization axis from the shape above (a user can mix
// any icon with any shape). "check" is the default, matching the app's
// look before this setting existed. "skull" is the deliberate easter
// egg — everything else is a "nice" pick, that one's just for fun.
export type CheckboxIcon = 'check' | 'star' | 'heart' | 'flame' | 'party-popper' | 'skull';

interface CheckboxStyleContextType {
    checkboxStyle: CheckboxStyle;
    setCheckboxStyle: (style: CheckboxStyle) => void;
    checkboxIcon: CheckboxIcon;
    setCheckboxIcon: (icon: CheckboxIcon) => void;
}

const CheckboxStyleContext = createContext<CheckboxStyleContextType | undefined>(undefined);

const isCheckboxStyle = (v: string | null): v is CheckboxStyle =>
    v === 'legacy' || v === 'soft' || v === 'circle';

const isCheckboxIcon = (v: string | null): v is CheckboxIcon =>
    v === 'check' || v === 'star' || v === 'heart' || v === 'flame' || v === 'party-popper' || v === 'skull';

// Same dual-persistence (shared cookie + localStorage) pattern as
// ThemeContext/AccessibilityContext — this is the same tier of setting
// (whole-app visual preference), not a per-feature opt-in toggle.
export const CheckboxStyleProvider = ({ children }: { children: React.ReactNode }) => {
    const [checkboxStyle, setCheckboxStyleState] = useState<CheckboxStyle>(() => {
        const cookieValue = getSharedCookie('rc_checkbox_style');
        if (isCheckboxStyle(cookieValue)) return cookieValue;
        const storedValue = localStorage.getItem('rc_checkbox_style');
        if (isCheckboxStyle(storedValue)) return storedValue;
        return 'legacy';
    });

    const [checkboxIcon, setCheckboxIconState] = useState<CheckboxIcon>(() => {
        const cookieValue = getSharedCookie('rc_checkbox_icon');
        if (isCheckboxIcon(cookieValue)) return cookieValue;
        const storedValue = localStorage.getItem('rc_checkbox_icon');
        if (isCheckboxIcon(storedValue)) return storedValue;
        return 'check';
    });

    useEffect(() => {
        localStorage.setItem('rc_checkbox_style', checkboxStyle);
        setSharedCookie('rc_checkbox_style', checkboxStyle);
    }, [checkboxStyle]);

    useEffect(() => {
        localStorage.setItem('rc_checkbox_icon', checkboxIcon);
        setSharedCookie('rc_checkbox_icon', checkboxIcon);
    }, [checkboxIcon]);

    return (
        <CheckboxStyleContext.Provider
            value={{
                checkboxStyle,
                setCheckboxStyle: setCheckboxStyleState,
                checkboxIcon,
                setCheckboxIcon: setCheckboxIconState,
            }}
        >
            {children}
        </CheckboxStyleContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider by design
export const useCheckboxStyle = () => {
    const context = useContext(CheckboxStyleContext);
    if (context === undefined) {
        throw new Error('useCheckboxStyle must be used within a CheckboxStyleProvider');
    }
    return context;
};
