/**
 * Phone number formatting utilities
 * Consolidated from multiple implementations across the codebase
 */

/**
 * Format phone number for display (US format)
 * Example: 1234567890 -> (123) 456-7890
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  // Return as-is if not a standard format
  return phoneNumber;
}

/**
 * Format phone number for international SMS sending
 * Ensures number has country code prefix
 */
export function formatPhoneForSMS(phoneNumber: string, defaultCountryCode: string = '1'): string {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle empty input
  if (!cleaned) {
    return '';
  }
  
  // If number doesn't start with country code, add it
  if (!cleaned.startsWith(defaultCountryCode) && cleaned.length <= 10) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  // Always return with + prefix for international format
  return '+' + cleaned;
}

/**
 * Format phone number for storage in database
 * Stores only digits without any formatting
 */
export function formatPhoneForStorage(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Extract country code from phone number
 * Returns the country code and remaining number
 */
export function extractCountryCode(phoneNumber: string): { countryCode: string; number: string } {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check common country codes (in order of length)
  const countryCodes = [
    '1',    // US, Canada
    '44',   // UK
    '61',   // Australia
    '64',   // New Zealand
    '353',  // Ireland
    '49',   // Germany
    '33',   // France
    '34',   // Spain
    '39',   // Italy
    '31',   // Netherlands
    '32',   // Belgium
    '41',   // Switzerland
    '43',   // Austria
    '46',   // Sweden
    '47',   // Norway
    '45',   // Denmark
    '358',  // Finland
    '351',  // Portugal
    '48',   // Poland
    '81',   // Japan
    '82',   // South Korea
    '86',   // China
    '91',   // India
    '55',   // Brazil
    '52',   // Mexico
    '54',   // Argentina
    '27',   // South Africa
    '65',   // Singapore
    '852',  // Hong Kong
    '60',   // Malaysia
    '66',   // Thailand
    '62',   // Indonesia
    '63',   // Philippines
  ];
  
  // Sort by length (longest first) to match correctly
  const sortedCodes = countryCodes.sort((a, b) => b.length - a.length);
  
  for (const code of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return {
        countryCode: code,
        number: cleaned.slice(code.length)
      };
    }
  }
  
  // Default to treating first digit as country code
  return {
    countryCode: cleaned.slice(0, 1),
    number: cleaned.slice(1)
  };
}

/**
 * Format phone input as user types
 * Provides real-time formatting feedback
 */
export function formatPhoneAsYouType(input: string, countryCode: string = '1'): string {
  const cleaned = input.replace(/\D/g, '');
  
  if (countryCode === '1') {
    // US/Canada formatting
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
    }
  }
  
  // Generic international formatting
  return cleaned;
}