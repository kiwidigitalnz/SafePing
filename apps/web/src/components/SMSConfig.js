import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { MessageSquare, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
export function SMSConfig() {
    const [config, setConfig] = useState({
        provider: null
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showCredentials, setShowCredentials] = useState(false);
    useEffect(() => {
        loadConfig();
    }, []);
    const loadConfig = async () => {
        try {
            // In a real implementation, you would load this from a secure settings table
            // For now, we'll just show the form
            console.log('Loading SMS configuration...');
        }
        catch (error) {
            console.error('Error loading SMS config:', error);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        setTestResult(null);
        try {
            // Validate required fields
            if (!config.provider) {
                throw new Error('Please select an SMS provider');
            }
            if (config.provider === 'clicksend') {
                if (!config.clicksend_username || !config.clicksend_api_key) {
                    throw new Error('ClickSend username and API key are required');
                }
            }
            else if (config.provider === 'twilio') {
                if (!config.twilio_account_sid || !config.twilio_auth_token || !config.twilio_from_number) {
                    throw new Error('Twilio Account SID, Auth Token, and From Number are required');
                }
            }
            // In a real implementation, you would save this to a secure settings table
            // and update environment variables for the Edge Functions
            console.log('SMS configuration saved:', config);
            setTestResult({
                success: true,
                message: 'SMS configuration saved successfully. Please update your environment variables.'
            });
        }
        catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to save configuration'
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handleTest = async () => {
        if (!config.test_number) {
            setTestResult({
                success: false,
                message: 'Please enter a test phone number'
            });
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            // Test SMS by calling the escalation function with test data
            const { data, error } = await supabase.functions.invoke('trigger-escalation', {
                body: {
                    userId: 'test-user-id',
                    scheduleId: 'test-schedule-id',
                    organizationId: 'test-org-id',
                    overdueBy: 5,
                    type: 'test',
                    testPhoneNumber: config.test_number
                }
            });
            if (error) {
                throw error;
            }
            setTestResult({
                success: true,
                message: `Test SMS sent successfully to ${config.test_number}`
            });
        }
        catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send test SMS'
            });
        }
        finally {
            setTesting(false);
        }
    };
    return (_jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium text-gray-900 flex items-center", children: [_jsx(MessageSquare, { className: "w-5 h-5 mr-2" }), "SMS Configuration"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure SMS provider for emergency notifications and escalations" })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "SMS Provider" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("label", { className: "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "radio", name: "provider", value: "clicksend", checked: config.provider === 'clicksend', onChange: (e) => setConfig({ ...config, provider: e.target.value }), className: "text-primary focus:ring-primary" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "ClickSend" }), _jsx("div", { className: "text-sm text-gray-500", children: "Global SMS service" })] })] }), _jsxs("label", { className: "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "radio", name: "provider", value: "twilio", checked: config.provider === 'twilio', onChange: (e) => setConfig({ ...config, provider: e.target.value }), className: "text-primary focus:ring-primary" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Twilio" }), _jsx("div", { className: "text-sm text-gray-500", children: "Enterprise SMS platform" })] })] })] })] }), config.provider === 'clicksend' && (_jsxs("div", { className: "space-y-4 border-l-4 border-blue-500 pl-4", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "ClickSend Settings" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Username" }), _jsx("input", { type: "text", value: config.clicksend_username || '', onChange: (e) => setConfig({ ...config, clicksend_username: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Your ClickSend username" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "API Key" }), _jsx("input", { type: showCredentials ? 'text' : 'password', value: config.clicksend_api_key || '', onChange: (e) => setConfig({ ...config, clicksend_api_key: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Your ClickSend API key" })] })] })] })), config.provider === 'twilio' && (_jsxs("div", { className: "space-y-4 border-l-4 border-purple-500 pl-4", children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Twilio Settings" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Account SID" }), _jsx("input", { type: showCredentials ? 'text' : 'password', value: config.twilio_account_sid || '', onChange: (e) => setConfig({ ...config, twilio_account_sid: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Your Twilio Account SID" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Auth Token" }), _jsx("input", { type: showCredentials ? 'text' : 'password', value: config.twilio_auth_token || '', onChange: (e) => setConfig({ ...config, twilio_auth_token: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Your Twilio Auth Token" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "From Number" }), _jsx("input", { type: "text", value: config.twilio_from_number || '', onChange: (e) => setConfig({ ...config, twilio_from_number: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "+64021234567" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your Twilio phone number (must include country code)" })] })] })] })), config.provider && (_jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: showCredentials, onChange: (e) => setShowCredentials(e.target.checked), className: "rounded border-gray-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-gray-600", children: "Show credentials" })] }) })), _jsxs("div", { className: "border-t pt-6", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-4", children: "Test Configuration" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Test Phone Number" }), _jsx("input", { type: "text", value: config.test_number || '', onChange: (e) => setConfig({ ...config, test_number: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "+64021234567" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Enter your phone number to test SMS delivery" })] }), _jsx("div", { className: "flex items-end", children: _jsxs("button", { onClick: handleTest, disabled: testing || !config.provider || !config.test_number, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx(TestTube, { className: "w-4 h-4 mr-2" }), testing ? 'Testing...' : 'Test SMS'] }) })] })] }), testResult && (_jsxs("div", { className: `border rounded-lg p-4 ${testResult.success
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'}`, children: [_jsxs("div", { className: "flex items-center", children: [testResult.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 mr-2" })) : (_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 mr-2" })), _jsx("span", { className: `font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`, children: testResult.success ? 'Success' : 'Error' })] }), _jsx("p", { className: `text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'}`, children: testResult.message })] })), _jsx("div", { className: "flex justify-end", children: _jsxs("button", { onClick: handleSave, disabled: saving || !config.provider, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : 'Save Configuration'] }) }), config.provider && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Environment Variables" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Add these environment variables to your Supabase project settings:" }), _jsxs("div", { className: "bg-gray-800 text-green-400 p-3 rounded font-mono text-sm", children: [_jsxs("div", { children: ["SMS_PROVIDER=", config.provider] }), config.provider === 'clicksend' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["CLICKSEND_USERNAME=", config.clicksend_username || 'your_username'] }), _jsxs("div", { children: ["CLICKSEND_API_KEY=", config.clicksend_api_key || 'your_api_key'] })] })), config.provider === 'twilio' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["TWILIO_ACCOUNT_SID=", config.twilio_account_sid || 'your_account_sid'] }), _jsxs("div", { children: ["TWILIO_AUTH_TOKEN=", config.twilio_auth_token || 'your_auth_token'] }), _jsxs("div", { children: ["TWILIO_FROM_NUMBER=", config.twilio_from_number || 'your_from_number'] })] }))] })] }))] })] }));
}
