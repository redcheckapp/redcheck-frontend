import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

// Catches render errors anywhere below it so one broken component doesn't
// blank out the whole app. Deliberately doesn't rely on ThemeContext /
// LanguageContext — if those are what's broken, the fallback still needs
// to render, so it reads the browser locale directly instead.
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, info: unknown) {
        console.error("Unhandled render error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            const isSpanish = typeof navigator !== "undefined" && navigator.language.startsWith("es");

            return (
                <div className="min-h-screen flex items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 p-6">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="bg-[#cc2229] w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg">
                            <span className="text-white text-3xl font-black">!</span>
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isSpanish ? "Algo salió mal" : "Something went wrong"}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isSpanish
                                ? "Ha ocurrido un error inesperado. Prueba a recargar la página."
                                : "An unexpected error occurred. Try reloading the page."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors"
                        >
                            <RefreshCw size={16} />
                            {isSpanish ? "Recargar" : "Reload"}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
