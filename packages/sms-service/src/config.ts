/**
 * SMS Service Configuration Helpers
 */

import type { SMSConfig } from './types';

/**
 * Get SMS configuration from environment variables
 * Works in both Node.js and Deno environments
 */
export function getSMSConfig(env?: Record<string, string | undefined>): SMSConfig | null {
  // Use provided env or fall back to process.env (Node) or Deno.env
  const getEnv = (key: string): string | undefined => {
    if (env) {
      return env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    if (typeof (globalThis as any).Deno !== 'undefined' && (globalThis as any).Deno.env) {
      return (globalThis as any).Deno.env.get(key);
    }
    return undefined;
  };

  const provider = getEnv('SMS_PROVIDER') as 'clicksend' | 'twilio' | undefined;
  
  if (!provider) {
    console.warn('No SMS provider configured');
    return null;
  }

  switch (provider) {
    case 'clicksend': {
      const username = getEnv('CLICKSEND_USERNAME');
      const apiKey = getEnv('CLICKSEND_API_KEY');
      
      if (!username || !apiKey) {
        console.warn('ClickSend credentials not configured');
        return null;
      }
      
      return {
        provider: 'clicksend',
        username,
        apiKey
      };
    }
      
    case 'twilio': {
      const accountSid = getEnv('TWILIO_ACCOUNT_SID');
      const authToken = getEnv('TWILIO_AUTH_TOKEN');
      const fromNumber = getEnv('TWILIO_FROM_NUMBER');
      
      if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials not configured');
        return null;
      }
      
      return {
        provider: 'twilio',
        accountSid,
        authToken,
        fromNumber
      };
    }
      
    default:
      console.warn(`Unsupported SMS provider: ${provider}`);
      return null;
  }
}

/**
 * Create SMS service from environment
 */
export async function createSMSServiceFromEnv(env?: Record<string, string | undefined>) {
  const config = getSMSConfig(env);
  
  if (!config) {
    throw new Error('SMS service not configured');
  }
  
  const { SMSService } = await import('./service');
  return new SMSService(config);
}