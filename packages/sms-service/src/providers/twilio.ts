/**
 * Twilio SMS Provider
 */

import type { SMSConfig, SMSMessage, SMSResult, SMSProvider } from '../types';

export class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config: SMSConfig) {
    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new Error('Twilio requires accountSid, authToken, and fromNumber');
    }
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromNumber = config.fromNumber;
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.accountSid}:${this.authToken}`)
        },
        body: new URLSearchParams({
          To: message.to,
          From: message.from || this.fromNumber,
          Body: message.message
        }).toString()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send SMS');
      }

      return {
        success: true,
        messageId: data.sid,
        cost: data.price ? parseFloat(data.price) : undefined,
        error: data.error_code ? data.error_message : undefined,
        provider: 'twilio'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'twilio'
      };
    }
  }
}