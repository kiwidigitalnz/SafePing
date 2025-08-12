/**
 * @safeping/sms-service
 * 
 * Centralized SMS service for the SafePing platform
 * Supports multiple providers with a unified interface
 */

// Main exports
export { SMSService } from './service';
export { getSMSConfig, createSMSServiceFromEnv } from './config';

// Type exports
export type {
  SMSConfig,
  SMSMessage,
  SMSResult,
  BulkSMSResult,
  SMSProvider
} from './types';

// Provider exports (if needed for direct use)
export { ClickSendProvider } from './providers/clicksend';
export { TwilioProvider } from './providers/twilio';