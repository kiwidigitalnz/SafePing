import { supabase } from './supabase';
// Cache for user data to prevent duplicate fetches
let userDataCache = {};
const CACHE_DURATION = 5000; // 5 seconds
/**
 * Get stored session from localStorage
 */
export async function getStoredSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[Auth] Error getting stored session:', error);
            return null;
        }
        return session;
    }
    catch (error) {
        console.error('[Auth] Unexpected error getting stored session:', error);
        return null;
    }
}
/**
 * Refresh the current session
 */
export async function refreshSession() {
    try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
            console.error('[Auth] Error refreshing session:', error);
            return null;
        }
        return session;
    }
    catch (error) {
        console.error('[Auth] Unexpected error refreshing session:', error);
        return null;
    }
}
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error)
        throw error;
    // Clear cache on sign in
    userDataCache = {};
    // Fetch additional user data from our users table
    if (data.user) {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role, first_name, last_name')
            .eq('id', data.user.id)
            .single();
        if (userError) {
            // User authenticated but not in public.users table
            if (userError.code === 'PGRST116') {
                // Check verification status
                const { data: statusData, error: statusError } = await supabase.functions.invoke('check-verification-status', {
                    body: { email }
                });
                if (statusError) {
                    console.error('Error checking verification status:', statusError);
                    throw new Error('Failed to verify account status');
                }
                if (statusData?.status === 'pending_verification') {
                    // Return special response indicating verification needed
                    return {
                        ...data,
                        needsVerification: true,
                        verificationType: statusData.verificationType,
                        verificationMetadata: statusData.metadata
                    };
                }
                // No pending verification found - inconsistent state
                throw new Error('Account setup incomplete. Please contact support.');
            }
            throw userError;
        }
        return {
            ...data,
            user: {
                ...data.user,
                ...userData,
            }
        };
    }
    return data;
}
/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error)
        throw error;
    // Clear cache on sign in
    userDataCache = {};
    return data;
}
/**
 * Handle OAuth callback after redirect
 */
export async function handleOAuthCallback() {
    const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    if (error)
        throw error;
    // Clear cache on successful OAuth
    userDataCache = {};
    // Check if user exists in our users table
    if (data.user) {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role, first_name, last_name')
            .eq('id', data.user.id)
            .single();
        if (userError && userError.code === 'PGRST116') {
            // User doesn't exist in public.users table yet
            // They need to complete onboarding
            return {
                ...data,
                needsOnboarding: true,
            };
        }
        return data;
    }
    return data;
}
export async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });
    if (error)
        throw error;
    return data;
}
export async function signOut() {
    // Clear cache on sign out
    userDataCache = {};
    const { error } = await supabase.auth.signOut();
    if (error)
        throw error;
}
export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error)
        throw error;
}
export async function getCurrentUser() {
    try {
        console.log('[Auth] Getting current user...');
        // First, try to get the session (this is fast and uses cached data)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('[Auth] Session error:', sessionError);
            return null;
        }
        if (!session?.user) {
            console.log('[Auth] No session found');
            return null;
        }
        const user = session.user;
        console.log('[Auth] Found session for user:', user.id);
        // Check cache first
        const cached = userDataCache[user.id];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('[Auth] Using cached user data');
            return {
                ...user,
                ...cached.data,
            };
        }
        // Fetch additional user data with timeout
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout fetching user data')), 5000);
            });
            const userDataPromise = supabase
                .from('users')
                .select('organization_id, role, first_name, last_name')
                .eq('id', user.id)
                .single();
            const { data: userData, error } = await Promise.race([
                userDataPromise,
                timeoutPromise
            ]);
            if (error) {
                // PGRST116 means user exists in auth.users but not in public.users
                // This is expected for users who haven't completed verification
                if (error.code === 'PGRST116') {
                    console.log('[Auth] User not in public.users table (unverified)');
                    return user;
                }
                console.error('[Auth] Error fetching user data:', error);
                return user;
            }
            // Cache the user data
            userDataCache[user.id] = {
                data: userData,
                timestamp: Date.now()
            };
            return {
                ...user,
                ...userData,
            };
        }
        catch (error) {
            console.error('[Auth] Error fetching additional user data:', error);
            // Return basic user without additional data
            return user;
        }
    }
    catch (error) {
        console.error('[Auth] Unexpected error in getCurrentUser:', error);
        return null;
    }
}
export function onAuthStateChange(callback) {
    // Track the last event to prevent duplicate processing
    let lastEventProcessed = null;
    return supabase.auth.onAuthStateChange(async (event, session) => {
        const eventKey = `${event}-${session?.user?.id || 'null'}-${Date.now()}`;
        // Skip if we just processed this event (within 50ms)
        if (lastEventProcessed === event && session?.user?.id) {
            console.log('[Auth] Skipping duplicate event:', event);
            return;
        }
        lastEventProcessed = event;
        console.log('[Auth] Processing auth event:', event, session?.user?.id);
        if (event === 'SIGNED_OUT') {
            // Clear cache on sign out
            userDataCache = {};
            callback(null);
            return;
        }
        if (session?.user) {
            try {
                // For INITIAL_SESSION and SIGNED_IN, we already have the user
                // Just fetch additional data
                const user = session.user;
                // Try to get cached data first
                const cached = userDataCache[user.id];
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                    callback({
                        ...user,
                        ...cached.data,
                    });
                    return;
                }
                // Fetch fresh data
                const { data: userData } = await supabase
                    .from('users')
                    .select('organization_id, role, first_name, last_name')
                    .eq('id', user.id)
                    .single();
                if (userData) {
                    // Cache the data
                    userDataCache[user.id] = {
                        data: userData,
                        timestamp: Date.now()
                    };
                    callback({
                        ...user,
                        ...userData,
                    });
                }
                else {
                    callback(user);
                }
            }
            catch (error) {
                console.error('[Auth] Error in auth state change:', error);
                // Still return the basic user on error
                if (session.user) {
                    callback(session.user);
                }
                else {
                    callback(null);
                }
            }
        }
        else {
            callback(null);
        }
    });
}
/**
 * Get user permissions based on role
 */
export function getUserPermissions(role) {
    const permissions = {
        super_admin: {
            manage_system: true,
            manage_organizations: true,
            manage_organization: true,
            manage_users: true,
            manage_settings: true,
            manage_billing: true,
            view_all_data: true,
            manage_schedules: true,
            manage_incidents: true,
            view_reports: true,
            check_in: true,
            view_own_data: true,
            update_profile: true,
            view_schedules: true
        },
        org_admin: {
            manage_organization: true,
            manage_users: true,
            manage_settings: true,
            manage_billing: true,
            view_all_data: true,
            manage_schedules: true,
            manage_incidents: true,
            view_reports: true,
            check_in: true,
            view_own_data: true,
            update_profile: true,
            view_schedules: true
        },
        admin: {
            manage_users: true,
            view_all_data: true,
            manage_schedules: true,
            manage_incidents: true,
            view_reports: true,
            check_in: true,
            view_own_data: true,
            update_profile: true,
            view_schedules: true
        },
        staff: {
            check_in: true,
            view_own_data: true,
            update_profile: true,
            view_schedules: true
        }
    };
    return permissions[role] || permissions.staff;
}
/**
 * Check if user has specific permission
 */
export function hasPermission(user, permission) {
    if (!user?.role)
        return false;
    const permissions = getUserPermissions(user.role);
    return Boolean(permissions[permission]);
}
/**
 * Check if user is admin level (org_admin or above)
 */
export function isAdmin(user) {
    return hasPermission(user, 'manage_users');
}
/**
 * Check if user is org admin level (org_admin or super_admin)
 */
export function isOrgAdmin(user) {
    return hasPermission(user, 'manage_organization');
}
/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
    const displayNames = {
        super_admin: 'Super Admin',
        org_admin: 'Organization Admin',
        admin: 'Admin',
        staff: 'Staff'
    };
    return displayNames[role] || 'Staff';
}
/**
 * Get role description
 */
export function getRoleDescription(role) {
    const descriptions = {
        super_admin: 'System administrator with full access across all organizations',
        org_admin: 'Organization administrator with full access within their organization',
        admin: 'Administrative user with operational access within their organization',
        staff: 'Standard user with basic check-in and profile access'
    };
    return descriptions[role] || descriptions.staff;
}
