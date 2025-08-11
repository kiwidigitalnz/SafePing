// Standardized error handling utilities
/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error) {
    if (!error)
        return 'An unknown error occurred';
    // If it's already a string
    if (typeof error === 'string')
        return error;
    // If it's an Error object
    if (error instanceof Error) {
        // Try to parse JSON from the message if it contains JSON
        try {
            const jsonMatch = error.message.match(/\{.*\}/s);
            if (jsonMatch) {
                const errorData = JSON.parse(jsonMatch[0]);
                return errorData.error || errorData.message || error.message;
            }
        }
        catch (e) {
            // Fall back to original message
        }
        return error.message;
    }
    // If it's an object with error properties
    if (typeof error === 'object') {
        return error.error || error.message || error.details || 'An error occurred';
    }
    return 'An unknown error occurred';
}
/**
 * Create standardized error response
 */
export function createErrorResponse(error, fallbackMessage = 'An error occurred') {
    return {
        success: false,
        error: {
            message: extractErrorMessage(error) || fallbackMessage,
            code: error?.code,
            details: error?.details
        }
    };
}
/**
 * Create standardized success response
 */
export function createSuccessResponse(data) {
    return {
        success: true,
        data
    };
}
/**
 * Handle Supabase Edge Function errors
 */
export function handleEdgeFunctionError(error) {
    const message = extractErrorMessage(error);
    // Handle specific error cases
    if (message.includes('Failed to send a request to the Edge Function')) {
        return 'Service temporarily unavailable. Please try again later.';
    }
    if (message.includes('duplicate key value') || error?.code === '23505') {
        return 'This item already exists. Please choose a different name.';
    }
    if (message.includes('User already registered')) {
        return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('Email service not configured')) {
        return 'Email service is not configured. Please contact support.';
    }
    if (message.includes('RESEND_API_KEY')) {
        return 'Email service is not available. Please contact support.';
    }
    return message;
}
/**
 * Auth-specific error messages
 */
export function getAuthErrorMessage(error) {
    const message = extractErrorMessage(error);
    // Supabase auth error codes
    if (error?.code === 'invalid_credentials') {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (error?.code === 'email_not_confirmed') {
        return 'Please verify your email address before signing in.';
    }
    if (error?.code === 'too_many_requests') {
        return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (error?.code === 'weak_password') {
        return 'Password is too weak. Please choose a stronger password.';
    }
    if (error?.code === 'signup_disabled') {
        return 'New registrations are currently disabled.';
    }
    if (message.includes('Invalid verification code')) {
        return 'The verification code is incorrect or has expired. Please try again.';
    }
    if (message.includes('expired')) {
        return 'The verification code has expired. Please request a new one.';
    }
    if (message.includes('already been used')) {
        return 'This verification code has already been used. Please request a new one.';
    }
    if (message.includes('Too many failed attempts')) {
        return 'Too many failed attempts. Please request a new verification code.';
    }
    return handleEdgeFunctionError(error);
}
/**
 * Validation error messages
 */
export function getValidationErrorMessage(field, error) {
    const message = extractErrorMessage(error);
    if (message.includes('required')) {
        return `${field} is required`;
    }
    if (message.includes('email')) {
        return 'Please enter a valid email address';
    }
    if (message.includes('password')) {
        return 'Password must be at least 8 characters long';
    }
    if (message.includes('phone')) {
        return 'Please enter a valid phone number';
    }
    return message;
}
