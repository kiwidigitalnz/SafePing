/**
 * @safeping/phone-utils
 * 
 * Centralized phone number utilities for the SafePing platform
 * Consolidates all phone-related functionality in one place
 */

// Export all utilities
export * from './countries';
export * from './formatter';
export * from './validator';

// Re-export commonly used functions at top level
export { 
  formatPhoneForDisplay,
  formatPhoneForSMS,
  formatPhoneForStorage,
  isValidPhoneNumber,
  isValidForSMS,
  COUNTRIES,
  getDefaultCountry 
} from './countries';