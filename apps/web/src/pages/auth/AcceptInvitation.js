import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '../../lib/auth';
import { Eye, EyeOff } from 'lucide-react';
const acceptInvitationSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export function AcceptInvitation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const organizationName = searchParams.get('organizationName');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(acceptInvitationSchema),
    });
    useEffect(() => {
        if (!email || !firstName || !organizationName) {
            navigate('/auth/signin');
        }
    }, [email, firstName, organizationName, navigate]);
    const onSubmit = async (data) => {
        if (!email || !firstName || !organizationName)
            return;
        setIsLoading(true);
        setError(null);
        try {
            // Create auth user for invitation acceptance
            await signUp(email, data.password, {
                first_name: firstName,
                invitation_type: 'admin_invitation'
            });
            setSuccess(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!email || !firstName || !organizationName) {
        return null; // Will redirect in useEffect
    }
    if (success) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100", children: _jsx("svg", { className: "h-6 w-6 text-green-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }), _jsx("h2", { className: "mt-4 text-2xl font-bold text-gray-900", children: "Check your email" }), _jsxs("p", { className: "mt-2 text-sm text-gray-600", children: ["We've sent a 6-digit verification code to ", _jsx("strong", { children: email }), ". Enter the code to complete your invitation acceptance."] })] }), _jsx("div", { className: "text-center", children: _jsx("button", { onClick: () => navigate('/auth/verify', {
                            state: {
                                email: email,
                                type: 'admin_invitation',
                                organizationName: organizationName,
                                firstName: firstName
                            }
                        }), className: "w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Enter Verification Code" }) }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/auth/signin", className: "font-medium text-primary hover:text-primary/90", children: "Back to sign in" }) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-center text-2xl font-bold text-gray-900", children: "Accept your invitation" }), _jsxs("p", { className: "mt-2 text-center text-sm text-gray-600", children: ["Join ", _jsx("strong", { children: organizationName }), " on SafePing"] })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-md p-4", children: _jsxs("div", { className: "flex", children: [_jsx("svg", { className: "h-5 w-5 text-blue-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-sm text-blue-800", children: "You've been invited to join as an administrator. Create your password to get started." }) })] }) }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-4", children: _jsx("p", { className: "text-sm text-red-800", children: error }) })), _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }), _jsx("div", { className: "mt-1", children: _jsx("input", { type: "email", value: email, disabled: true, className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm" }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-gray-700", children: "Name" }), _jsx("div", { className: "mt-1", children: _jsx("input", { type: "text", value: firstName, disabled: true, className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm" }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Create password" }), _jsxs("div", { className: "mt-1 relative", children: [_jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: "appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm", placeholder: "Create a secure password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4 text-gray-400" })) : (_jsx(Eye, { className: "h-4 w-4 text-gray-400" })) }), errors.password && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password.message }))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700", children: "Confirm password" }), _jsxs("div", { className: "mt-1 relative", children: [_jsx("input", { ...register('confirmPassword'), type: showConfirmPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: "appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm", placeholder: "Confirm your password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowConfirmPassword(!showConfirmPassword), children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-4 w-4 text-gray-400" })) : (_jsx(Eye, { className: "h-4 w-4 text-gray-400" })) }), errors.confirmPassword && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.confirmPassword.message }))] })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" })) : ('Accept Invitation') }) }), _jsx("div", { className: "text-center", children: _jsx(Link, { to: "/auth/signin", className: "font-medium text-primary hover:text-primary/90", children: "Already have an account? Sign in" }) })] })] }));
}
