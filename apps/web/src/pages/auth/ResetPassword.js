import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Lock, AlertCircle, Shield, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export function ResetPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);
    const { register, handleSubmit, formState: { errors, isValid }, watch, } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onChange',
    });
    const watchPassword = watch('password');
    const watchConfirmPassword = watch('confirmPassword');
    useEffect(() => {
        // Check if we have a valid recovery token
        const checkToken = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                setIsValidToken(false);
                setError('Invalid or expired reset link. Please request a new password reset.');
            }
        };
        checkToken();
    }, []);
    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });
            if (error)
                throw error;
            setSuccess(true);
            // Sign out to ensure clean state
            await supabase.auth.signOut();
            // Redirect to sign in after a short delay
            setTimeout(() => {
                navigate('/auth/signin');
            }, 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            // Add subtle shake animation on error
            const form = document.getElementById('reset-password-form');
            if (form) {
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password)
            return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 8)
            strength++;
        if (password.match(/[a-z]/))
            strength++;
        if (password.match(/[A-Z]/))
            strength++;
        if (password.match(/[0-9]/))
            strength++;
        if (password.match(/[^a-zA-Z0-9]/))
            strength++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
        return {
            strength,
            label: labels[strength],
            color: colors[strength]
        };
    };
    const passwordStrength = getPasswordStrength(watchPassword || '');
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24", children: _jsxs("div", { className: "mx-auto w-full max-w-sm lg:max-w-md", children: [_jsxs("button", { onClick: () => navigate(-1), className: "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8 group", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" }), "Back"] }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: success ? 'Password reset successful!' : 'Create new password' }), _jsx("p", { className: "mt-2 text-base text-gray-600", children: success
                                        ? 'Your password has been successfully reset.'
                                        : 'Your new password must be different from previously used passwords.' })] }), success && (_jsx("div", { className: "mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-800", children: "Password updated!" }), _jsx("p", { className: "text-sm text-green-700 mt-1", children: "Redirecting you to sign in..." })] })] }) })), error && (_jsxs("div", { className: "mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-red-800", children: error }), !isValidToken && (_jsx("button", { onClick: () => navigate('/auth/forgot-password'), className: "text-sm text-red-700 underline mt-2 hover:text-red-800", children: "Request a new reset link" }))] })] })), !success && isValidToken && (_jsxs("form", { id: "reset-password-form", className: "space-y-5", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "New password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: `h-5 w-5 ${watchPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: `
                      appearance-none block w-full pl-10 pr-10 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.password
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `, placeholder: "Enter new password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), watchPassword && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-xs text-gray-600", children: "Password strength:" }), _jsx("span", { className: "text-xs font-medium text-gray-700", children: passwordStrength.label })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-1.5", children: _jsx("div", { className: `h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`, style: { width: `${(passwordStrength.strength / 5) * 100}%` } }) })] })), errors.password && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.password.message] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Confirm new password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: `h-5 w-5 ${watchConfirmPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('confirmPassword'), type: showConfirmPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: `
                      appearance-none block w-full pl-10 pr-10 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.confirmPassword
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `, placeholder: "Confirm new password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors", onClick: () => setShowConfirmPassword(!showConfirmPassword), children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), errors.confirmPassword && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.confirmPassword.message] }))] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading || !isValid, className: `
                    group relative w-full flex justify-center items-center py-3 px-4 
                    border border-transparent text-sm font-medium rounded-xl 
                    text-white transition-all duration-200
                    ${isLoading || !isValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  `, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" }), "Resetting password..."] })) : (_jsx(_Fragment, { children: "Reset password" })) }) })] }))] }) }), _jsx("div", { className: "hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100", children: _jsx("div", { className: "flex flex-col justify-center px-20 xl:px-24", children: _jsxs("div", { className: "max-w-lg", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Create a strong password" }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-gray-700", children: "Use at least 8 characters" }) })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-gray-700", children: "Include uppercase and lowercase letters" }) })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-gray-700", children: "Add at least one number" }) })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-gray-700", children: "Consider using special characters for extra security" }) })] })] }), _jsxs("div", { className: "mt-8 p-4 bg-blue-50 rounded-xl", children: [_jsx("p", { className: "text-sm text-blue-900 font-medium mb-2", children: "Pro tip:" }), _jsx("p", { className: "text-sm text-blue-800", children: "Use a unique password for SafePing that you don't use for other accounts. Consider using a password manager to generate and store strong passwords securely." })] })] }) }) })] }));
}
