import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn, signInWithGoogle } from '../../lib/auth';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, Users, CheckCircle, ArrowLeft } from 'lucide-react';
const signInSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export function SignIn() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rememberMe, setRememberMe] = useState(true);
    const { register, handleSubmit, formState: { errors, isValid }, watch, } = useForm({
        resolver: zodResolver(signInSchema),
        mode: 'onChange',
    });
    const watchEmail = watch('email');
    const watchPassword = watch('password');
    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signIn(data.email, data.password);
            // Check if user needs verification
            if (result && 'needsVerification' in result && result.needsVerification) {
                // Redirect to verification page with proper state
                navigate('/auth/verify', {
                    state: {
                        email: data.email,
                        type: result.verificationType,
                        organizationName: result.verificationMetadata?.organizationName,
                        firstName: result.verificationMetadata?.firstName,
                        lastName: result.verificationMetadata?.lastName
                    }
                });
                return;
            }
            // Normal signin successful - auth store will handle navigation
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            // Add subtle shake animation on error
            const form = document.getElementById('signin-form');
            if (form) {
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // Google OAuth will redirect to the callback URL
            // No need to handle navigation here
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
            setIsLoading(false);
        }
    };
    const handleBack = () => {
        // In production, this would be your landing page domain
        // In development, redirect to the landing app running on port 5175
        const landingUrl = import.meta.env.PROD
            ? 'https://safeping.co.nz' // Replace with your actual production landing page URL
            : 'http://localhost:5175';
        window.location.href = landingUrl;
    };
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24", children: _jsxs("div", { className: "mx-auto w-full max-w-sm lg:max-w-md", children: [_jsxs("button", { onClick: handleBack, className: "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8 group", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" }), "Back to homepage"] }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: "Welcome back" }), _jsx("p", { className: "mt-2 text-base text-gray-600", children: "Sign in to access your SafePing dashboard" })] }), error && (_jsxs("div", { className: "mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-800", children: error })] })), _jsxs("form", { id: "signin-form", className: "space-y-5", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Mail, { className: `h-5 w-5 ${watchEmail ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('email'), type: "email", autoComplete: "email", required: true, className: `
                    appearance-none block w-full pl-10 pr-3 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.email
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "you@company.com" })] }), errors.email && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.email.message] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: `h-5 w-5 ${watchPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', autoComplete: "current-password", required: true, className: `
                    appearance-none block w-full pl-10 pr-10 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.password
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "Enter your password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), errors.password && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.password.message] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "remember-me", name: "remember-me", type: "checkbox", checked: rememberMe, onChange: (e) => setRememberMe(e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all" }), _jsx("label", { htmlFor: "remember-me", className: "ml-2 block text-sm text-gray-700 cursor-pointer", children: "Remember me" })] }), _jsx("div", { className: "text-sm", children: _jsx(Link, { to: "/auth/forgot-password", className: "font-medium text-blue-600 hover:text-blue-500 transition-colors", children: "Forgot password?" }) })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading || !isValid, className: `
                  group relative w-full flex justify-center items-center py-3 px-4 
                  border border-transparent text-sm font-medium rounded-xl 
                  text-white transition-all duration-200
                  ${isLoading || !isValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                `, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" }), "Signing in..."] })) : (_jsxs(_Fragment, { children: ["Sign in", _jsx(ArrowRight, { className: "ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" })] })) }) }), _jsxs("div", { className: "relative my-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "Or continue with" }) })] }), _jsx("div", { children: _jsxs("button", { type: "button", onClick: handleGoogleSignIn, disabled: isLoading, className: "w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Sign in with Google"] }) }), _jsxs("div", { className: "relative my-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "New to SafePing?" }) })] }), _jsx("div", { className: "text-center", children: _jsxs(Link, { to: "/auth/signup", className: "inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Create a new organization"] }) })] })] }) }), _jsx("div", { className: "hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100", children: _jsx("div", { className: "flex flex-col justify-center px-20 xl:px-24", children: _jsxs("div", { className: "max-w-lg", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Keep your team safe with SafePing" }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(CheckCircle, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Real-time Check-ins" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Monitor your team's safety status with automated check-in schedules" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Shield, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Emergency Response" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Instant alerts and escalation protocols for emergency situations" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Users, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Team Management" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Organize teams, set schedules, and manage permissions effortlessly" })] })] })] })] }) }) })] }));
}
