import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '../../lib/auth';
import { Shield } from 'lucide-react';
export function OAuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    useEffect(() => {
        const processCallback = async () => {
            try {
                const result = await handleOAuthCallback();
                if (result && 'needsOnboarding' in result && result.needsOnboarding) {
                    // New user needs to complete onboarding
                    navigate('/onboarding');
                }
                else {
                    // Existing user, go to dashboard
                    navigate('/dashboard');
                }
            }
            catch (err) {
                console.error('OAuth callback error:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');
                // Redirect to sign in page after a delay
                setTimeout(() => {
                    navigate('/auth/signin');
                }, 3000);
            }
        };
        processCallback();
    }, [navigate]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-white" }) }), error ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Authentication Failed" }), _jsx("p", { className: "text-gray-600 mb-4", children: error }), _jsx("p", { className: "text-sm text-gray-500", children: "Redirecting to sign in..." })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Completing sign in..." }), _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4" })] }))] }) }));
}
