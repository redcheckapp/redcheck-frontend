import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Route-level code splitting: each page becomes its own chunk, loaded on
// demand instead of being bundled into the initial download.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const RouteFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500">
        <div className="bg-[#cc2229] w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg animate-pulse" />
    </div>
);

const App = () => {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/" element={<LoginPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </ThemeProvider>
        </LanguageProvider>
    );
};

export default App;