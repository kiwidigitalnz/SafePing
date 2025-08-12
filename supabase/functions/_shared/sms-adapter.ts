/**
 * SMS Service Adapter for Supabase Edge Functions
 * Adapts the shared SMS service for use in Deno environment
 */

import { formatPhoneForSMS, isValidForSMS } from './phone-utils.ts'
import { SMSService, getSMSConfig } from './sms-service.ts'

// Re-export types and utilities
export { formatPhoneForSMS as formatPhoneNumber, isValidForSMS as isValidPhoneNumber }
export type { SMSConfig, SMSMessage, SMSResult } from './sms-service.ts'
export { SMSService, getSMSConfig }