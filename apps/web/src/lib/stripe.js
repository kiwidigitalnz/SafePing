import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';
let stripePromise;
export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
    }
    return stripePromise;
};
export const subscriptionService = {
    // Get all available subscription plans
    async getPlans() {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_cents');
        if (error)
            throw error;
        return data || [];
    },
    // Get current organization subscription
    async getCurrentSubscription() {
        const { data, error } = await supabase.functions.invoke('manage-subscription', {
            body: { action: 'get_subscription' }
        });
        if (error)
            throw error;
        return data?.subscription || null;
    },
    // Create Stripe checkout session
    async createCheckoutSession(planId, successUrl = `${window.location.origin}/settings?tab=billing&success=true`, cancelUrl = `${window.location.origin}/settings?tab=billing&canceled=true`) {
        const { data, error } = await supabase.functions.invoke('manage-subscription', {
            body: {
                action: 'create_checkout_session',
                planId,
                successUrl,
                cancelUrl
            }
        });
        if (error)
            throw error;
        return data;
    },
    // Create Stripe customer portal session
    async createPortalSession(returnUrl = `${window.location.origin}/settings?tab=billing`) {
        const { data, error } = await supabase.functions.invoke('manage-subscription', {
            body: {
                action: 'create_portal_session',
                successUrl: returnUrl
            }
        });
        if (error)
            throw error;
        return data;
    },
    // Cancel subscription at period end
    async cancelSubscription() {
        const { data, error } = await supabase.functions.invoke('manage-subscription', {
            body: { action: 'cancel_subscription' }
        });
        if (error)
            throw error;
        return data;
    },
    // Get billing events/history
    async getBillingHistory() {
        const { data, error } = await supabase
            .from('billing_events')
            .select('*')
            .order('processed_at', { ascending: false })
            .limit(50);
        if (error)
            throw error;
        return data || [];
    },
    // Check if organization can add more staff
    async canAddStaff() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                return false;
            const { data: userData } = await supabase
                .from('users')
                .select('organization_id, role')
                .eq('id', user.id)
                .single();
            if (!userData?.organization_id)
                return false;
            const { data, error } = await supabase.rpc('can_add_staff', {
                org_id: userData.organization_id
            });
            if (error) {
                console.error('Error checking staff limit:', error);
                return false;
            }
            return data === true;
        }
        catch (error) {
            console.error('Error in canAddStaff:', error);
            return false;
        }
    },
    // Helper to get current user
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                return null;
            const { data: userData } = await supabase
                .from('users')
                .select('organization_id, role')
                .eq('id', user.id)
                .single();
            return userData;
        }
        catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
};
// Utility functions for formatting
export const formatPrice = (cents, currency = 'NZD') => {
    return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(cents / 100);
};
export const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString));
};
export const getSubscriptionStatusColor = (status) => {
    switch (status) {
        case 'active':
            return 'text-green-600 bg-green-100';
        case 'trialing':
            return 'text-blue-600 bg-blue-100';
        case 'past_due':
            return 'text-yellow-600 bg-yellow-100';
        case 'canceled':
        case 'incomplete_expired':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
};
export const getSubscriptionStatusText = (status) => {
    switch (status) {
        case 'active':
            return 'Active';
        case 'trialing':
            return 'Trial';
        case 'past_due':
            return 'Past Due';
        case 'canceled':
            return 'Canceled';
        case 'incomplete':
            return 'Incomplete';
        case 'incomplete_expired':
            return 'Expired';
        case 'unpaid':
            return 'Unpaid';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
};
