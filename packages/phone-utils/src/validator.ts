/**
 * Phone number validation utilities
 */

/**
 * Validate if a phone number is valid
 * Checks for proper length and format based on country
 */
export function isValidPhoneNumber(phoneNumber: string, countryCode?: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Basic validation - must have digits
  if (!cleaned || cleaned.length < 7) {
    return false;
  }
  
  // Country-specific validation
  if (countryCode === '1' || countryCode === 'US' || countryCode === 'CA') {
    // US/Canada - must be 10 digits (or 11 with country code)
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  }
  
  // General international validation
  // Most international numbers are between 7-15 digits
  return cleaned.length >= 7 && cleaned.length <= 15;
}

/**
 * Validate phone number for SMS capability
 * More strict validation for SMS sending
 */
export function isValidForSMS(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Must be between 10-15 digits for SMS
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Must not start with 0 (except for some countries)
  if (cleaned.startsWith('0')) {
    return false;
  }
  
  // Basic pattern matching for common formats
  // This regex ensures the number looks like a real phone number
  const phoneRegex = /^[1-9]\d{9,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Check if phone number has country code
 */
export function hasCountryCode(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // US/Canada numbers without country code are exactly 10 digits
  if (cleaned.length === 10) {
    return false;
  }
  
  // Most numbers with country codes are 11+ digits
  return cleaned.length > 10;
}

/**
 * Normalize phone number for comparison
 * Removes all formatting and ensures consistent format
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Handle common cases
  if (cleaned.length === 10) {
    // Assume US/Canada without country code
    cleaned = '1' + cleaned;
  }
  
  return cleaned;
}

/**
 * Compare if two phone numbers are the same
 * Handles different formats and country code variations
 */
export function isSamePhoneNumber(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  // Direct comparison
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Check if one has country code and other doesn't (US/Canada specific)
  if (normalized1.length === 11 && normalized2.length === 10) {
    return normalized1.endsWith(normalized2);
  }
  if (normalized2.length === 11 && normalized1.length === 10) {
    return normalized2.endsWith(normalized1);
  }
  
  return false;
}