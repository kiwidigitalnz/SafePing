import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { subscriptionService, formatPrice, formatDate, getSubscriptionStatusColor, getSubscriptionStatusText } from '../lib/stripe';
export function BillingManagement() {
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [billingHistory, setBillingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadBillingData();
    }, []);
    const loadBillingData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [plansData, subscriptionData, historyData] = await Promise.all([
                subscriptionService.getPlans(),
                subscriptionService.getCurrentSubscription(),
                subscriptionService.getBillingHistory()
            ]);
            setPlans(plansData);
            setCurrentSubscription(subscriptionData);
            setBillingHistory(historyData);
        }
        catch (err) {
            console.error('Error loading billing data:', err);
            setError('Failed to load billing information');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubscribe = async (planId) => {
        try {
            setActionLoading(planId);
            setError(null);
            const { url } = await subscriptionService.createCheckoutSession(planId);
            // Redirect to Stripe Checkout
            window.location.href = url;
        }
        catch (err) {
            console.error('Error creating checkout session:', err);
            setError('Failed to start subscription process');
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleManageBilling = async () => {
        try {
            setActionLoading('portal');
            setError(null);
            const { url } = await subscriptionService.createPortalSession();
            // Open Stripe Customer Portal
            window.open(url, '_blank');
        }
        catch (err) {
            console.error('Error opening billing portal:', err);
            setError('Failed to open billing portal');
        }
        finally {
            setActionLoading(null);
        }
    };
    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
            return;
        }
        try {
            setActionLoading('cancel');
            setError(null);
            await subscriptionService.cancelSubscription();
            await loadBillingData(); // Refresh data
        }
        catch (err) {
            console.error('Error canceling subscription:', err);
            setError('Failed to cancel subscription');
        }
        finally {
            setActionLoading(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-800", children: error }) })), currentSubscription ? (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Current Subscription" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Plan" }), _jsx("p", { className: "font-medium", children: currentSubscription.plan_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Status" }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionStatusColor(currentSubscription.status)}`, children: getSubscriptionStatusText(currentSubscription.status) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Staff Limit" }), _jsx("p", { className: "font-medium", children: currentSubscription.max_staff === 999999 ? 'Unlimited' : currentSubscription.max_staff })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: currentSubscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing' }), _jsx("p", { className: "font-medium", children: formatDate(currentSubscription.status === 'trialing' && currentSubscription.trial_end
                                            ? currentSubscription.trial_end
                                            : currentSubscription.current_period_end) })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: handleManageBilling, disabled: actionLoading === 'portal', className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: actionLoading === 'portal' ? 'Opening...' : 'Manage Billing' }), currentSubscription.status === 'active' && (_jsx("button", { onClick: handleCancelSubscription, disabled: actionLoading === 'cancel', className: "px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed", children: actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription' }))] }), _jsxs("div", { className: "mt-6", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 mb-2", children: "Included Features" }), _jsx("div", { className: "grid grid-cols-2 gap-2 text-sm text-gray-600", children: Object.entries(currentSubscription.features).map(([feature, enabled]) => (enabled && (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-green-500 mr-2", children: "\u2713" }), feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())] }, feature)))) })] })] })) : (
            /* No Subscription - Show Plans */
            _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Choose Your Plan" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: plans.map((plan) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-6 relative", children: [plan.name === 'Professional' && (_jsx("div", { className: "absolute -top-3 left-1/2 transform -translate-x-1/2", children: _jsx("span", { className: "bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full", children: "Most Popular" }) })), _jsxs("div", { className: "text-center mb-6", children: [_jsx("h4", { className: "text-xl font-semibold text-gray-900", children: plan.name }), _jsx("p", { className: "text-gray-600 text-sm mt-1", children: plan.description }), _jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "text-3xl font-bold text-gray-900", children: formatPrice(plan.price_cents) }), _jsxs("span", { className: "text-gray-600", children: ["/", plan.interval] })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Up to ", plan.max_staff === 999999 ? 'unlimited' : plan.max_staff, " staff"] })] }), _jsx("div", { className: "space-y-3 mb-6", children: Object.entries(plan.features).map(([feature, enabled]) => (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx("span", { className: `mr-3 ${enabled ? 'text-green-500' : 'text-gray-300'}`, children: enabled ? '✓' : '✗' }), _jsx("span", { className: enabled ? 'text-gray-700' : 'text-gray-400', children: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })] }, feature))) }), _jsx("button", { onClick: () => handleSubscribe(plan.id), disabled: actionLoading === plan.id, className: `w-full py-2 px-4 rounded-lg font-medium ${plan.name === 'Professional'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`, children: actionLoading === plan.id ? 'Starting...' : 'Start 14-Day Trial' })] }, plan.id))) })] })), billingHistory.length > 0 && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Billing History" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Event" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Amount" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: billingHistory.map((event) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(event.processed_at) }), _jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-900", children: event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }), _jsx("td", { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-900", children: event.amount_cents ? formatPrice(event.amount_cents, event.currency || 'NZD') : '-' }), _jsx("td", { className: "px-4 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.status === 'succeeded' ? 'text-green-600 bg-green-100' :
                                                        event.status === 'failed' ? 'text-red-600 bg-red-100' :
                                                            'text-gray-600 bg-gray-100'}`, children: event.status || 'Processing' }) })] }, event.id))) })] }) })] }))] }));
}
