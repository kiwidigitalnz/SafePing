import { supabase } from './supabase';
/**
 * Validate current auth state and determine appropriate action
 */
export async function validateAuthState(email) {
    try {
        // Check current auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Session error:', sessionError);
            return {
                isValid: false,
                status: 'error',
                message: 'Failed to check authentication status'
            };
        }
        // If user is authenticated, check if they have a complete profile
        if (session?.user) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, organization_id, role, first_name, last_name')
                .eq('id', session.user.id)
                .single();
            if (userError && userError.code !== 'PGRST116') {
                console.error('User data error:', userError);
                return {
                    isValid: false,
                    status: 'error',
                    message: 'Failed to load user profile'
                };
            }
            if (userData) {
                // User is fully authenticated and has profile
                return {
                    isValid: true,
                    status: 'authenticated',
                    redirectTo: '/dashboard'
                };
            }
            else {
                // User has auth session but no profile - incomplete signup
                return {
                    isValid: false,
                    status: 'pending_verification',
                    message: 'Account setup incomplete',
                    redirectTo: '/auth/signin'
                };
            }
        }
        // No session - check for pending verification if email provided
        if (email) {
            const verificationStatus = await checkVerificationStatus(email);
            return verificationStatus;
        }
        // No session and no email - user needs to sign in
        return {
            isValid: false,
            status: 'not_found',
            redirectTo: '/auth/signin'
        };
    }
    catch (error) {
        console.error('Auth validation error:', error);
        return {
            isValid: false,
            status: 'error',
            message: 'Authentication validation failed'
        };
    }
}
/**
 * Check verification status for an email
 */
export async function checkVerificationStatus(email) {
    try {
        const { data, error } = await supabase.functions.invoke('check-verification-status', {
            body: { email }
        });
        if (error) {
            console.error('Verification status error:', error);
            return {
                isValid: false,
                status: 'error',
                message: 'Failed to check verification status'
            };
        }
        switch (data.status) {
            case 'registered':
                return {
                    isValid: true,
                    status: 'authenticated',
                    redirectTo: '/auth/signin',
                    message: 'Account exists - please sign in'
                };
            case 'pending_verification':
                return {
                    isValid: false,
                    status: 'pending_verification',
                    redirectTo: '/auth/verify',
                    metadata: data.metadata,
                    message: 'Verification pending'
                };
            case 'not_found':
            default:
                return {
                    isValid: false,
                    status: 'not_found',
                    redirectTo: '/auth/signup',
                    message: 'No account found'
                };
        }
    }
    catch (error) {
        console.error('Verification status check error:', error);
        return {
            isValid: false,
            status: 'error',
            message: 'Failed to check verification status'
        };
    }
}
/**
 * Validate signup form data before submission
 */
export function validateSignupData(data) {
    const errors = [];
    // Organization name validation
    if (!data.organizationName || data.organizationName.trim().length < 2) {
        errors.push('Organization name must be at least 2 characters');
    }
    // Name validation
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Please enter a valid email address');
    }
    // Password validation
    if (!data.password || data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'password123'];
    if (weakPasswords.includes(data.password.toLowerCase())) {
        errors.push('Please choose a stronger password');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Generate organization slug with conflict checking
 */
export async function generateOrganizationSlug(name) {
    // Basic slug generation
    let baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    // Ensure minimum length
    if (baseSlug.length < 3) {
        baseSlug = `org-${baseSlug}`;
    }
    // Check for conflicts and add suffix if needed
    let finalSlug = baseSlug;
    let counter = 0;
    while (await slugExists(finalSlug)) {
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
    }
    return finalSlug;
}
/**
 * Check if organization slug already exists
 */
async function slugExists(slug) {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .limit(1);
        if (error && error.code !== 'PGRST116') {
            console.error('Slug check error:', error);
            return false; // Assume it doesn't exist if we can't check
        }
        return !!(data && data.length > 0);
    }
    catch (error) {
        console.error('Slug existence check failed:', error);
        return false;
    }
}
/**
 * Clean up expired verification codes (client-side helper)
 */
export async function cleanupExpiredVerifications(email) {
    try {
        // This would typically be handled by a database trigger or cron job
        // But we can call it from the client as a helper
        await supabase
            .from('verification_codes')
            .delete()
            .eq('email', email)
            .lt('expires_at', new Date().toISOString());
    }
    catch (error) {
        console.error('Failed to cleanup expired verifications:', error);
        // Don't throw - this is a cleanup operation
    }
}
