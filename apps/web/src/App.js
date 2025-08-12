import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { VerifyCode } from './pages/auth/VerifyCode';
import { Onboarding } from './pages/auth/Onboarding';
import { AcceptInvitation } from './pages/auth/AcceptInvitation';
import { OAuthCallback } from './pages/auth/OAuthCallback';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { TermsOfService } from './pages/legal/TermsOfService';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { Dashboard } from './pages/Dashboard';
import { Staff } from './pages/Staff';
import { CheckIns } from './pages/CheckIns';
import { Schedules } from './pages/Schedules';
import { Incidents } from './pages/Incidents';
import { Settings } from './pages/Settings';
import InviteStaffPage from './pages/InviteStaff';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function ProtectedRoute({ children }) {
    const { user, loading } = useAuthStore();
    const location = useLocation();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/auth/signin", replace: true });
    }
    // Check if user has completed setup (has organization_id)
    if (!user.organization_id) {
        // Allow access to onboarding page
        if (location.pathname === '/onboarding') {
            return _jsx(_Fragment, { children: children });
        }
        // For users without organization, they need to complete signup/verification first
        // This should only happen if they somehow bypassed the normal flow
        return _jsx(Navigate, { to: "/auth/signin", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function PublicRoute({ children }) {
    const { user, loading } = useAuthStore();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
    }
    // Simple logic: if user is authenticated and has organization_id, redirect to dashboard
    if (user && user.organization_id) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    // Allow access to public routes (including verify page for unverified users)
    return _jsx(_Fragment, { children: children });
}
function App() {
    const initialize = useAuthStore((state) => state.initialize);
    useEffect(() => {
        initialize();
    }, [initialize]);
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsxs(Route, { path: "/auth/*", element: _jsx(PublicRoute, { children: _jsx(AuthLayout, {}) }), children: [_jsx(Route, { path: "signin", element: _jsx(SignIn, {}) }), _jsx(Route, { path: "signup", element: _jsx(SignUp, {}) }), _jsx(Route, { path: "verify", element: _jsx(VerifyCode, {}) }), _jsx(Route, { path: "accept-invitation", element: _jsx(AcceptInvitation, {}) }), _jsx(Route, { path: "callback", element: _jsx(OAuthCallback, {}) }), _jsx(Route, { path: "forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "reset-password", element: _jsx(ResetPassword, {}) })] }), _jsx(Route, { path: "/onboarding", element: _jsx(Onboarding, {}) }), _jsx(Route, { path: "/legal/terms", element: _jsx(TermsOfService, {}) }), _jsx(Route, { path: "/legal/privacy", element: _jsx(PrivacyPolicy, {}) }), _jsxs(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(DashboardLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "staff", element: _jsx(Staff, {}) }), _jsx(Route, { path: "staff/invite", element: _jsx(InviteStaffPage, {}) }), _jsx(Route, { path: "checkins", element: _jsx(CheckIns, {}) }), _jsx(Route, { path: "schedules", element: _jsx(Schedules, {}) }), _jsx(Route, { path: "incidents", element: _jsx(Incidents, {}) }), _jsx(Route, { path: "settings", element: _jsx(Settings, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }) }) }));
}
export default App;
