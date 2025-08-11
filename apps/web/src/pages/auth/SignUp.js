import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../lib/errors';
import { generateOrganizationSlug, validateSignupData } from '../../lib/authValidation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, Building2, User, CheckCircle, ArrowLeft } from 'lucide-react';
const signUpSchema = z.object({
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
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
export function SignUp() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { register, handleSubmit, formState: { errors, isValid }, watch, } = useForm({
        resolver: zodResolver(signUpSchema),
        mode: 'onChange',
    });
    const watchPassword = watch('password');
    const watchEmail = watch('email');
    const watchOrgName = watch('organizationName');
    const watchFirstName = watch('firstName');
    const watchLastName = watch('lastName');
    const watchConfirmPassword = watch('confirmPassword');
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
    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            // Validate form data
            const validation = validateSignupData(data);
            if (!validation.isValid) {
                setError(validation.errors.join('. '));
                return;
            }
            // Generate unique organization slug
            const slug = await generateOrganizationSlug(data.organizationName);
            // Create pending organization record and send verification code
            const { data: codeData, error: codeError } = await supabase.functions.invoke('send-verification-code', {
                body: {
                    email: data.email,
                    type: 'signup_verification',
                    organizationName: data.organizationName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    password: data.password, // Pass password securely to backend
                    metadata: {
                        organization_name: data.organizationName,
                        first_name: data.firstName,
                        last_name: data.lastName,
                        slug: slug
                    }
                }
            });
            if (codeError) {
                throw codeError;
            }
            // Check if the function returned an error in the data
            if (codeData && !codeData.success && codeData.error) {
                throw new Error(codeData.error);
            }
            // Show success message briefly before navigating
            setSuccessMessage('Verification code sent! Redirecting...');
            // Navigate to verification page after a short delay
            setTimeout(() => {
                navigate('/auth/verify', {
                    state: {
                        email: data.email,
                        type: 'signup_verification',
                        organizationName: data.organizationName,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        slug: slug
                    }
                });
            }, 1500);
        }
        catch (err) {
            console.error('Signup error:', err);
            setError(getAuthErrorMessage(err));
            // Add subtle shake animation on error
            const form = document.getElementById('signup-form');
            if (form) {
                form.classList.add('animate-shake');
                setTimeout(() => form.classList.remove('animate-shake'), 500);
            }
        }
        finally {
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
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24", children: _jsxs("div", { className: "mx-auto w-full max-w-sm lg:max-w-md", children: [_jsxs("button", { onClick: handleBack, className: "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8 group", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" }), "Back to homepage"] }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: "Create your organization" }), _jsx("p", { className: "mt-2 text-base text-gray-600", children: "Set up your SafePing account to start protecting your team" })] }), error && (_jsxs("div", { className: "mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-red-800", children: error })] })), successMessage && (_jsx("div", { className: "mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-green-800", children: successMessage })] }) })), _jsxs("form", { id: "signup-form", className: "space-y-5", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Organization name" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Building2, { className: `h-5 w-5 ${watchOrgName ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('organizationName'), type: "text", required: true, className: `
                    appearance-none block w-full pl-10 pr-3 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.organizationName
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "Your company or team name" })] }), errors.organizationName && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.organizationName.message] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "firstName", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "First name" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(User, { className: `h-5 w-5 ${watchFirstName ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('firstName'), type: "text", required: true, className: `
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.firstName
                                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `, placeholder: "John" })] }), errors.firstName && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.firstName.message] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "lastName", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Last name" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(User, { className: `h-5 w-5 ${watchLastName ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('lastName'), type: "text", required: true, className: `
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.lastName
                                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `, placeholder: "Doe" })] }), errors.lastName && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.lastName.message] }))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Mail, { className: `h-5 w-5 ${watchEmail ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('email'), type: "email", autoComplete: "email", required: true, className: `
                    appearance-none block w-full pl-10 pr-3 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.email
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "you@company.com" })] }), errors.email && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.email.message] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: `h-5 w-5 ${watchPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: `
                    appearance-none block w-full pl-10 pr-10 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.password
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "Create a strong password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), watchPassword && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-xs text-gray-600", children: "Password strength:" }), _jsx("span", { className: "text-xs font-medium text-gray-700", children: passwordStrength.label })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-1.5", children: _jsx("div", { className: `h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`, style: { width: `${(passwordStrength.strength / 5) * 100}%` } }) })] })), errors.password && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.password.message] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-1.5", children: "Confirm password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: `h-5 w-5 ${watchConfirmPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors` }) }), _jsx("input", { ...register('confirmPassword'), type: showConfirmPassword ? 'text' : 'password', autoComplete: "new-password", required: true, className: `
                    appearance-none block w-full pl-10 pr-10 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.confirmPassword
                                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `, placeholder: "Confirm your password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors", onClick: () => setShowConfirmPassword(!showConfirmPassword), children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), errors.confirmPassword && (_jsxs("p", { className: "mt-1.5 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.confirmPassword.message] }))] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading || !isValid, className: `
                  group relative w-full flex justify-center items-center py-3 px-4 
                  border border-transparent text-sm font-medium rounded-xl 
                  text-white transition-all duration-200
                  ${isLoading || !isValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                `, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" }), "Creating account..."] })) : (_jsxs(_Fragment, { children: ["Create account", _jsx(ArrowRight, { className: "ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" })] })) }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-xs text-gray-500 text-center", children: ["By creating an account, you agree to our", ' ', _jsx(Link, { to: "/legal/terms", className: "text-blue-600 hover:text-blue-500", children: "Terms of Service" }), ' ', "and", ' ', _jsx(Link, { to: "/legal/privacy", className: "text-blue-600 hover:text-blue-500", children: "Privacy Policy" })] }), _jsxs("div", { className: "text-center text-sm text-gray-600", children: ["Already have an account?", ' ', _jsx(Link, { to: "/auth/signin", className: "font-medium text-blue-600 hover:text-blue-500 transition-colors", children: "Sign in" })] })] })] })] }) }), _jsx("div", { className: "hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100", children: _jsx("div", { className: "flex flex-col justify-center px-20 xl:px-24", children: _jsxs("div", { className: "max-w-lg", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Start protecting your team in minutes" }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Shield, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Enterprise-grade security" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Your data is encrypted and protected with industry-leading security standards" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(CheckCircle, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Quick setup" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Get your team up and running with SafePing in less than 5 minutes" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white", children: _jsx(Building2, { className: "h-6 w-6" }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "text-lg font-medium text-gray-900", children: "Scalable solution" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Whether you have 10 or 10,000 employees, SafePing scales with your needs" })] })] })] }), _jsxs("div", { className: "mt-8 p-4 bg-blue-50 rounded-xl", children: [_jsx("p", { className: "text-sm text-blue-900 font-medium mb-2", children: "What's included:" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 Unlimited check-ins for your team" }), _jsx("li", { children: "\u2022 Real-time emergency alerts" }), _jsx("li", { children: "\u2022 Customizable escalation protocols" }), _jsx("li", { children: "\u2022 24/7 monitoring dashboard" })] })] })] }) }) })] }));
}
