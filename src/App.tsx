import { Suspense, lazy, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Check } from "lucide-react";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Route-level code splitting: each page becomes its own chunk, loaded on
// demand instead of being bundled into the initial download.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// tsParticles is a heavy dependency, so it's still its own lazy chunk. Its
// own Suspense boundary (separate from the routes below) means it resolves
// independently and — once mounted — is never destroyed by a route change,
// since it sits outside <Routes> and keeps the same position in the tree.
const BackgroundParticles = lazy(() =>
    import('./components/BackgroundParticles').then(m => ({ default: m.BackgroundParticles }))
);

// No opaque background here on purpose: it sits above BackgroundParticles,
// and a solid fill would flash over the animation on every route change.
// The body element (see index.html) already supplies the app's base color.
// Mirrors the logo + "loading" pattern already used inside DashboardPage's
// own loading state, so this reads the same regardless of which page it
// briefly shows in front of.
const RouteFallback = () => {
    const { language } = useLanguage();

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-5 animate-pulse">
                <div className="bg-[#cc2229] w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg">
                    <Check size={40} strokeWidth={4} className="text-white" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {language === 'es' ? 'Cargando...' : 'Loading...'}
                </span>
            </div>
        </div>
    );
};

// Routes that show the particle background.
const PARTICLE_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/terms", "/privacy"];

const AppShell = () => {
    const location = useLocation();
    const { theme } = useTheme();
    // One-way flag: once a public page has been visited, keep the particles
    // mounted for the rest of the session — including while on /dashboard,
    // where they're simply hidden behind its opaque background — so the
    // animation is never destroyed and recreated by a route change. A user
    // who goes straight to /dashboard (already logged in) never pays for it.
    const [showParticles, setShowParticles] = useState(() => PARTICLE_ROUTES.includes(location.pathname));

    // Render-phase update (not an effect): derives `showParticles` from the
    // current route without an extra render pass, and only ever flips it
    // from false to true, so this never loops.
    if (!showParticles && PARTICLE_ROUTES.includes(location.pathname)) {
        setShowParticles(true);
    }

    return (
        <ConfirmProvider>
            {showParticles && (
                <Suspense fallback={null}>
                    <BackgroundParticles />
                </Suspense>
            )}
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                </Routes>
            </Suspense>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: theme === "dark"
                        ? { background: "#27272a", color: "#f4f4f5", border: "1px solid #3f3f46" }
                        : { background: "#ffffff", color: "#18181b", border: "1px solid #f4f4f5" },
                }}
            />
        </ConfirmProvider>
    );
};

const App = () => {
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <ThemeProvider>
                    <AccessibilityProvider>
                        <BrowserRouter>
                            <AppShell />
                        </BrowserRouter>
                    </AccessibilityProvider>
                </ThemeProvider>
            </LanguageProvider>
        </ErrorBoundary>
    );
};

export default App;