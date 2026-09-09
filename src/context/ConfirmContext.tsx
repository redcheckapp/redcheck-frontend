import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ConfirmModal } from "../components/ConfirmModal";

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

interface PendingConfirm extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

// Promise-based replacement for window.confirm() — every destructive action
// in the app (delete subject/task/routine/account, empty trash, bulk
// delete) used the native browser dialog, which is unstyled and breaks the
// app's whole visual language. `useConfirm()` gives call sites the same
// "await, then branch on true/false" ergonomics window.confirm had, backed
// by ConfirmModal (built on ModalOverlay, matching every other modal here).
const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(
    () => Promise.resolve(false)
);

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider by design
export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setPending({ ...options, resolve });
        });
    }, []);

    const settle = (result: boolean) => {
        pending?.resolve(result);
        setPending(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmModal
                isOpen={pending !== null}
                title={pending?.title ?? ""}
                message={pending?.message ?? ""}
                confirmLabel={pending?.confirmLabel}
                cancelLabel={pending?.cancelLabel}
                onConfirm={() => settle(true)}
                onCancel={() => settle(false)}
            />
        </ConfirmContext.Provider>
    );
};
