import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '../../lib/auth';
import { Mail, AlertCircle, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
export function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors, isValid }, watch, } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onChange',
    });
    const watchEmail = watch('email');
    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await resetPassword(data.email);
            setSuccess(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
            // Add subtle shake animation on error
            const form = document.getElementById('forgot-password-form');
            if (form) {
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24", children: _jsxs("div", { className: "mx-auto w-full max-w-sm lg:max-w-md", children: [_jsxs(Link, { to: "/auth/signin", className: "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }), "Back to sign in"] }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: "Forgot your password?" }), _jsx("p", { className: "mt-2 text-base text-gray-600", children: "No worries! Enter your email and we'll send you reset instructions." })] }), success && (_jsx("div", { className: "mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-800", children: "Check your email!" }), _jsxs("p", { className: "text-sm text-green-700 mt-1", children: ["We've sent password reset instructions to ", watchEmail] }), _jsx("p", { className: "text-xs text-green-600 mt-2", children: "Didn't receive the email? Check your spam folder or try again." })] })] }) })), error && (_jsxs("div", { className: "mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-800", children: error })] })), !success && (_jsxs("form", { id: "forgot-password-form", className: "space-y-5", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Mail, { className: `h-5 w-5 ${watchEmail ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('email'), type: "email", autoComplete: "email", required: true, className: `
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.email
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `, placeholder: "you@company.com" })] }), errors.email && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.email.message] }))] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading || !isValid, className: `
                    group relative w-full flex justify-center items-center py-3 px-4 
                    border border-transparent text-sm font-medium rounded-xl 
                    text-white transition-all duration-200
                    ${isLoading || !isValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  `, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" }), "Sending reset email..."] })) : (_jsx(_Fragment, { children: "Send reset instructions" })) }) }), _jsx("div", { className: "text-center text-sm text-gray-600", children: _jsxs("p", { children: ["Remember your password?", ' ', _jsx(Link, { to: "/auth/signin", className: "font-medium text-blue-600 hover:text-blue-500 transition-colors", children: "Sign in" })] }) })] })), success && (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { to: "/auth/signin", className: "w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200", children: "Return to sign in" }), _jsx("button", { type: "button", onClick: () => {
                                        setSuccess(false);
                                        setError(null);
                                    }, className: "w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md", children: "Try a different email" })] }))] }) }), _jsx("div", { className: "hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100", children: _jsx("div", { className: "flex flex-col justify-center px-20 xl:px-24", children: _jsxs("div", { className: "max-w-lg", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Secure password recovery" }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Mail, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Email verification" }), _jsx("p", { className: "mt-1 text-gray-600", children: "We'll send a secure link to your registered email address" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Shield, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Secure reset" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Your password reset link expires after 1 hour for security" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(CheckCircle, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Quick recovery" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Get back to keeping your team safe in just a few clicks" })] })] })] }), _jsxs("div", { className: "mt-8 p-4 bg-blue-50 rounded-xl", children: [_jsx("p", { className: "text-sm text-blue-900 font-medium mb-2", children: "Security tip:" }), _jsx("p", { className: "text-sm text-blue-800", children: "Always check that password reset emails come from our official domain and never share your reset link with anyone." })] })] }) }) })] }));
}
