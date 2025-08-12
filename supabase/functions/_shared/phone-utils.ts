/**
 * Phone number utilities for Edge Functions
 * Copied from @safeping/phone-utils for Deno compatibility
 */

// Country data
export interface Country {
  name: string
  code: string
  dialCode: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { name: 'New Zealand', code: 'NZ', dialCode: '64', flag: '🇳🇿' },
  { name: 'Australia', code: 'AU', dialCode: '61', flag: '🇦🇺' },
  { name: 'United States', code: 'US', dialCode: '1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dialCode: '1', flag: '🇨🇦' },
  { name: 'India', code: 'IN', dialCode: '91', flag: '🇮🇳' },
  { name: 'China', code: 'CN', dialCode: '86', flag: '🇨🇳' },
  { name: 'Japan', code: 'JP', dialCode: '81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '82', flag: '🇰🇷' },
  { name: 'Germany', code: 'DE', dialCode: '49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '34', flag: '🇪🇸' },
  { name: 'Mexico', code: 'MX', dialCode: '52', flag: '🇲🇽' },
  { name: 'Brazil', code: 'BR', dialCode: '55', flag: '🇧🇷' },
  { name: 'Argentina', code: 'AR', dialCode: '54', flag: '🇦🇷' },
  { name: 'South Africa', code: 'ZA', dialCode: '27', flag: '🇿🇦' },
  { name: 'Nigeria', code: 'NG', dialCode: '234', flag: '🇳🇬' },
  { name: 'Egypt', code: 'EG', dialCode: '20', flag: '🇪🇬' },
  { name: 'Vietnam', code: 'VN', dialCode: '84', flag: '🇻🇳' },
  { name: 'Thailand', code: 'TH', dialCode: '66', flag: '🇹🇭' },
  { name: 'Philippines', code: 'PH', dialCode: '63', flag: '🇵🇭' },
  { name: 'Indonesia', code: 'ID', dialCode: '62', flag: '🇮🇩' },
  { name: 'Malaysia', code: 'MY', dialCode: '60', flag: '🇲🇾' },
  { name: 'Singapore', code: 'SG', dialCode: '65', flag: '🇸🇬' }
]

/**
 * Validate if a phone number is valid
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
  const phoneRegex = /^[1-9]\d{9,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number for SMS sending
 * Ensures E.164 format with + prefix
 */
export function formatPhoneForSMS(phoneNumber: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Check if it's a US number without country code
    if (cleaned.length === 10 && /^[2-9]/.test(cleaned)) {
      cleaned = '+1' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Format phone number for storage
 * Always stores in E.164 format
 */
export function formatPhoneForStorage(phoneNumber: string): string {
  return formatPhoneForSMS(phoneNumber);
}