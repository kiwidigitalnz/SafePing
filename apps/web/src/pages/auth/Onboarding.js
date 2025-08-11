import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
export function Onboarding() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, organization, loadOrganization } = useAuthStore();
    const state = location.state;
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (!user) {
            navigate('/auth/signin');
            return;
        }
        // Load organization data
        if (state?.organizationId && !organization) {
            loadOrganization(state.organizationId);
        }
        setIsLoading(false);
    }, [user, organization, state, navigate, loadOrganization]);
    const handleGetStarted = () => {
        // Navigate to settings page to complete organization profile
        navigate('/settings');
    };
    const handleSkipToApp = () => {
        navigate('/dashboard');
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
    }
    if (state?.isNewOrganization) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4", children: _jsx("div", { className: "max-w-2xl w-full", children: _jsxs("div", { className: "text-center space-y-8", children: [_jsx("div", { className: "mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse", children: _jsx("svg", { className: "w-12 h-12 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900", children: "\uD83C\uDF89 Welcome to SafePing!" }), _jsxs("p", { className: "text-xl text-gray-600", children: ["Your organization ", _jsx("span", { className: "font-semibold text-primary", children: organization?.name }), " is ready to go"] })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6 py-8", children: [_jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDCCD" }) }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Safety Check-ins" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure regular check-ins for your team" })] }), _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDEA8" }) }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Emergency Alerts" }), _jsx("p", { className: "text-sm text-gray-600", children: "Instant notifications when help is needed" })] }), _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDC65" }) }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Team Management" }), _jsx("p", { className: "text-sm text-gray-600", children: "Add and manage your team members" })] })] }), _jsxs("div", { className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Your 14-day free trial has started!" }), _jsx("p", { className: "text-blue-100", children: "Explore all SafePing features with no limits. No credit card required." })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Ready to get started?" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("button", { onClick: handleGetStarted, className: "px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors", children: "Set Up Your Organization" }), _jsx("button", { onClick: handleSkipToApp, className: "px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors", children: "Explore Dashboard First" })] })] })] }) }) }));
    }
    if (state?.isNewAdmin) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-xl w-full text-center space-y-8", children: [_jsx("div", { className: "mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse", children: _jsx("svg", { className: "w-12 h-12 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" }) }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Welcome to the team!" }), _jsxs("p", { className: "text-lg text-gray-600", children: ["You've successfully joined ", _jsx("span", { className: "font-semibold text-green-600", children: organization?.name }), " on SafePing"] })] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-green-900 mb-2", children: "Your Administrator Access" }), _jsx("p", { className: "text-green-800", children: "As an administrator, you can manage team members, configure safety settings, and help keep your organization secure." })] }), _jsx("button", { onClick: handleGetStarted, className: "px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors", children: "Go to Dashboard" })] }) }));
    }
    // Default fallback
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Welcome to SafePing" }), _jsx("button", { onClick: handleGetStarted, className: "px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90", children: "Get Started" })] }) }));
}
