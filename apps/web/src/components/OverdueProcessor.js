import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
export function OverdueProcessor() {
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [error, setError] = useState(null);
    const triggerProcessing = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: functionError } = await supabase.functions.invoke('process-overdue-checkins', {
                body: {
                    triggered_by: 'manual',
                    triggered_at: new Date().toISOString()
                }
            });
            if (functionError) {
                throw functionError;
            }
            setLastResult(data);
        }
        catch (err) {
            console.error('Error processing overdue check-ins:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    return (_jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Overdue Check-in Processing" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manually trigger the automated overdue check-in detection and escalation system" })] }), _jsxs("button", { onClick: triggerProcessing, disabled: loading, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}` }), loading ? 'Processing...' : 'Process Now'] })] }), loading && (_jsxs("div", { className: "border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(RefreshCw, { className: "w-5 h-5 text-blue-600 animate-spin mr-2" }), _jsx("span", { className: "text-blue-800 font-medium", children: "Processing overdue check-ins..." })] }), _jsx("p", { className: "text-blue-700 text-sm mt-1", children: "This may take a few moments depending on the number of active schedules and workers." })] })), error && (_jsxs("div", { className: "border border-red-200 bg-red-50 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 mr-2" }), _jsx("span", { className: "text-red-800 font-medium", children: "Processing Failed" })] }), _jsx("p", { className: "text-red-700 text-sm mt-1", children: error })] })), lastResult && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `border rounded-lg p-4 ${lastResult.success
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'}`, children: [_jsxs("div", { className: "flex items-center mb-3", children: [lastResult.success ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 mr-2" })) : (_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 mr-2" })), _jsx("span", { className: `font-medium ${lastResult.success ? 'text-green-800' : 'text-red-800'}`, children: lastResult.success ? 'Processing Completed' : 'Processing Failed' })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Processed At:" }), _jsx("p", { className: "font-medium", children: formatTime(lastResult.processed_at) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Schedules Checked:" }), _jsx("p", { className: "font-medium", children: lastResult.schedules_processed })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Overdue Found:" }), _jsx("p", { className: "font-medium", children: lastResult.overdue_checkins })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Status:" }), _jsx("p", { className: `font-medium ${lastResult.success ? 'text-green-700' : 'text-red-700'}`, children: lastResult.success ? 'Success' : 'Failed' })] })] }), lastResult.error && (_jsxs("div", { className: "mt-3 p-3 bg-red-100 rounded border border-red-200", children: [_jsx("p", { className: "text-red-800 text-sm font-medium", children: "Error Details:" }), _jsx("p", { className: "text-red-700 text-sm", children: lastResult.error })] }))] }), lastResult.overdue_details && lastResult.overdue_details.length > 0 && (_jsxs("div", { className: "border border-orange-200 bg-orange-50 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-orange-900 mb-3 flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-2" }), "Overdue Workers (", lastResult.overdue_details.length, ")"] }), _jsx("div", { className: "space-y-3", children: lastResult.overdue_details.map((detail, index) => (_jsx("div", { className: "bg-white rounded border border-orange-200 p-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-4 h-4 text-orange-600" }), _jsx("span", { className: "font-medium text-orange-900", children: detail.userName }), _jsxs("span", { className: "text-sm text-orange-700", children: ["(", detail.scheduleName, ")"] })] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm", children: [_jsxs("div", { className: "flex items-center text-orange-700", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), _jsxs("span", { children: [detail.overdueBy, " min overdue"] })] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${detail.gracePeriodExpired
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'}`, children: detail.gracePeriodExpired ? 'Grace Period Expired' : 'Within Grace Period' })] })] }) }, index))) })] })), lastResult.success && lastResult.overdue_checkins === 0 && (_jsxs("div", { className: "border border-green-200 bg-green-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 mr-2" }), _jsx("span", { className: "text-green-800 font-medium", children: "All workers are up to date!" })] }), _jsx("p", { className: "text-green-700 text-sm mt-1", children: "No overdue check-ins found. All scheduled workers have checked in on time." })] }))] })), _jsxs("div", { className: "mt-6 bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "About Automated Processing" }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-1", children: [_jsx("li", { children: "\u2022 This function runs automatically every 5 minutes in production" }), _jsx("li", { children: "\u2022 It checks all active schedules and identifies overdue workers" }), _jsx("li", { children: "\u2022 Escalations are triggered when grace periods expire" }), _jsx("li", { children: "\u2022 Use this manual trigger for testing or immediate processing" })] })] })] }));
}
