import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
export function OrganizationUsage() {
    const { organization, user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (user?.organization_id) {
            loadUsageStats();
        }
    }, [user?.organization_id]);
    const loadUsageStats = async () => {
        if (!user?.organization_id)
            return;
        try {
            setLoading(true);
            // Get staff counts
            const { data: staffData, error: staffError } = await supabase
                .from('users')
                .select('id, is_active')
                .eq('organization_id', user.organization_id)
                .neq('role', 'super_admin');
            if (staffError)
                throw staffError;
            // Get active schedules count
            const { data: schedulesData, error: schedulesError } = await supabase
                .from('schedules')
                .select('id')
                .eq('organization_id', user.organization_id)
                .eq('is_active', true);
            if (schedulesError)
                throw schedulesError;
            // Get recent check-ins (last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const { data: checkInsData, error: checkInsError } = await supabase
                .from('check_ins')
                .select('id')
                .eq('organization_id', user.organization_id)
                .gte('created_at', yesterday.toISOString());
            if (checkInsError)
                throw checkInsError;
            // Get pending incidents
            const { data: incidentsData, error: incidentsError } = await supabase
                .from('incidents')
                .select('id')
                .eq('organization_id', user.organization_id)
                .eq('status', 'open');
            if (incidentsError)
                throw incidentsError;
            setStats({
                totalStaff: staffData?.length || 0,
                activeStaff: staffData?.filter(u => u.is_active)?.length || 0,
                activeSchedules: schedulesData?.length || 0,
                recentCheckIns: checkInsData?.length || 0,
                pendingIncidents: incidentsData?.length || 0,
            });
        }
        catch (error) {
            console.error('Error loading usage stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getPlanDetails = () => {
        const plan = organization?.subscription_plan || 'basic';
        const planDetails = {
            basic: { name: 'Starter', maxStaff: 10, price: '$4.90' },
            professional: { name: 'Professional', maxStaff: 50, price: '$3.90' },
            enterprise: { name: 'Enterprise', maxStaff: 500, price: 'Custom' },
        };
        return planDetails[plan] || planDetails.basic;
    };
    const getTrialInfo = () => {
        if (!organization?.trial_ends_at)
            return null;
        const trialEnd = new Date(organization.trial_ends_at);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { trialEnd, daysLeft };
    };
    const planDetails = getPlanDetails();
    const trialInfo = getTrialInfo();
    const isTrialActive = organization?.subscription_status === 'trial';
    if (loading) {
        return (_jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/4 mb-4" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { className: "h-16 bg-gray-200 rounded" }), _jsx("div", { className: "h-16 bg-gray-200 rounded" })] })] }) }));
    }
    return (_jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Usage & Subscription" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Current plan usage and subscription information" })] }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-md font-medium text-gray-900", children: [planDetails.name, " Plan"] }), _jsxs("p", { className: "text-sm text-gray-600", children: [planDetails.price, " per staff member per month"] })] }), _jsx("div", { className: "text-right", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isTrialActive
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : organization?.subscription_status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'}`, children: isTrialActive ? 'Trial' : organization?.subscription_status || 'Unknown' }) })] }), isTrialActive && trialInfo && (_jsxs("div", { className: `p-3 rounded-md ${trialInfo.daysLeft <= 3
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-yellow-50 border border-yellow-200'}`, children: [_jsx("p", { className: `text-sm font-medium ${trialInfo.daysLeft <= 3 ? 'text-red-800' : 'text-yellow-800'}`, children: trialInfo.daysLeft > 0
                                            ? `Trial expires in ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'}`
                                            : 'Trial has expired' }), _jsx("p", { className: `text-sm ${trialInfo.daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'}`, children: "Upgrade to continue using SafePing after your trial ends" })] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDC65" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Staff" }), _jsxs("p", { className: "text-2xl font-semibold text-gray-900", children: [stats?.activeStaff, "/", stats?.totalStaff] })] })] }) }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDCC5" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Schedules" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats?.activeSchedules })] })] }) }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "text-2xl", children: "\u2705" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Recent Check-ins" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats?.recentCheckIns })] })] }) }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDEA8" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Open Incidents" }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: stats?.pendingIncidents })] })] }) })] }), _jsxs("div", { className: "border-t border-gray-200 pt-4", children: [_jsx("h5", { className: "text-sm font-medium text-gray-900 mb-3", children: "Plan Limits" }), _jsx("div", { className: "space-y-3", children: _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Staff Members" }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [stats?.totalStaff, " / ", planDetails.maxStaff] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full ${(stats?.totalStaff || 0) / planDetails.maxStaff > 0.8
                                                    ? 'bg-red-500'
                                                    : (stats?.totalStaff || 0) / planDetails.maxStaff > 0.6
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'}`, style: {
                                                    width: `${Math.min(((stats?.totalStaff || 0) / planDetails.maxStaff) * 100, 100)}%`
                                                } }) })] }) })] }), _jsx("div", { className: "border-t border-gray-200 pt-4 mt-4", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [isTrialActive && (_jsx("button", { className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Upgrade Plan" })), _jsx("button", { className: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "View Billing" }), _jsx("button", { onClick: loadUsageStats, className: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary", children: "Refresh Stats" })] }) })] })] }));
}
