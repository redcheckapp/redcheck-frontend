import { createContext, useContext, useEffect, useState } from 'react';
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

// "legacy" (sharp square) is the shape every task checkbox actually had
// before a typo'd `squared-full` class (a no-op — not a real Tailwind
// utility) silently left it unrounded; it's kept as the default here so a
// returning user's checkboxes look exactly as they always have, with
// "circle" (what the typo fix accidentally introduced) and "soft" offered
// as opt-in alternatives rather than the new default.
export type CheckboxStyle = 'legacy' | 'soft' | 'circle';

interface CheckboxStyleContextType {
    checkboxStyle: CheckboxStyle;
    setCheckboxStyle: (style: CheckboxStyle) => void;
}

const CheckboxStyleContext = createContext<CheckboxStyleContextType | undefined>(undefined);

const isCheckboxStyle = (v: string | null): v is CheckboxStyle =>
    v === 'legacy' || v === 'soft' || v === 'circle';

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

    useEffect(() => {
        localStorage.setItem('rc_checkbox_style', checkboxStyle);
        setSharedCookie('rc_checkbox_style', checkboxStyle);
    }, [checkboxStyle]);

    return (
        <CheckboxStyleContext.Provider value={{ checkboxStyle, setCheckboxStyle: setCheckboxStyleState }}>
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
