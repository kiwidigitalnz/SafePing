import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthStore } from '../store/auth';
import { subscriptionService } from '../lib/stripe';
export function TrialBanner() {
    const { subscription, isTrialExpired, daysUntilTrialExpires, isOrgAdmin } = useAuthStore();
    // Only show for org admins with trial subscriptions
    if (!subscription || subscription.status !== 'trialing' || !isOrgAdmin()) {
        return null;
    }
    const isExpired = isTrialExpired();
    const daysLeft = daysUntilTrialExpires();
    const handleUpgrade = async () => {
        try {
            // Get starter plan for upgrade
            const plans = await subscriptionService.getPlans();
            const starterPlan = plans.find(p => p.name === 'Starter');
            if (starterPlan) {
                const { url } = await subscriptionService.createCheckoutSession(starterPlan.id);
                window.location.href = url;
            }
        }
        catch (error) {
            console.error('Error starting upgrade:', error);
        }
    };
    if (isExpired) {
        return (_jsx("div", { className: "bg-red-600 text-white px-4 py-3", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-xl mr-3", children: "\u26A0\uFE0F" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Trial Expired" }), _jsx("p", { className: "text-sm opacity-90", children: "Your free trial has ended. Upgrade now to continue using SafePing." })] })] }), _jsx("button", { onClick: handleUpgrade, className: "bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors", children: "Upgrade Now" })] }) }));
    }
    if (daysLeft !== null && daysLeft <= 7) {
        return (_jsx("div", { className: "bg-yellow-500 text-yellow-900 px-4 py-3", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-xl mr-3", children: "\u23F0" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Trial Ending Soon" }), _jsxs("p", { className: "text-sm", children: ["Your free trial ends in ", daysLeft, " ", daysLeft === 1 ? 'day' : 'days', ". Upgrade to continue using SafePing."] })] })] }), _jsx("button", { onClick: handleUpgrade, className: "bg-yellow-900 text-yellow-100 px-4 py-2 rounded font-medium hover:bg-yellow-800 transition-colors", children: "Upgrade Now" })] }) }));
    }
    return null;
}
