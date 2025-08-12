/**
 * SMS Service Types
 */

export interface SMSConfig {
  provider: 'clicksend' | 'twilio';
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  cost?: number;
  error?: string;
  provider?: string;
}

export interface BulkSMSResult {
  successful: number;
  failed: number;
  results: SMSResult[];
}

export interface SMSProvider {
  sendSMS(message: SMSMessage): Promise<SMSResult>;
}