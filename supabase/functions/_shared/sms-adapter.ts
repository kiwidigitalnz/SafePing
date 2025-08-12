/**
 * SMS Service Adapter for Supabase Edge Functions
 * Adapts the shared SMS service for use in Deno environment
 */

import { SMSService, getSMSConfig } from '@safeping/sms-service'
import { formatPhoneForSMS, isValidForSMS } from '@safeping/phone-utils'

// Re-export types and utilities
export { formatPhoneForSMS as formatPhoneNumber, isValidForSMS as isValidPhoneNumber }
export type { SMSConfig, SMSMessage, SMSResult } from '@safeping/sms-service'

// Export SMS service with Deno environment config
export { SMSService }

// Deno-specific config getter
export function getDenoSMSConfig() {
  return getSMSConfig({
    SMS_PROVIDER: Deno.env.get('SMS_PROVIDER'),
    CLICKSEND_USERNAME: Deno.env.get('CLICKSEND_USERNAME'),
    CLICKSEND_API_KEY: Deno.env.get('CLICKSEND_API_KEY'),
    TWILIO_ACCOUNT_SID: Deno.env.get('TWILIO_ACCOUNT_SID'),
    TWILIO_AUTH_TOKEN: Deno.env.get('TWILIO_AUTH_TOKEN'),
    TWILIO_FROM_NUMBER: Deno.env.get('TWILIO_FROM_NUMBER'),
  })
}

// For backward compatibility
export { getDenoSMSConfig as getSMSConfig }