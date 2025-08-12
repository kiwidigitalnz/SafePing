/**
 * Main SMS Service
 * Factory pattern for creating SMS providers
 */

import { formatPhoneForSMS, isValidForSMS } from '@safeping/phone-utils';
import type { SMSConfig, SMSMessage, SMSResult, BulkSMSResult, SMSProvider } from './types';
import { ClickSendProvider } from './providers/clicksend';
import { TwilioProvider } from './providers/twilio';

export class SMSService {
  private provider: SMSProvider;
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
    
    switch (config.provider) {
      case 'clicksend':
        this.provider = new ClickSendProvider(config);
        break;
      case 'twilio':
        this.provider = new TwilioProvider(config);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${config.provider}`);
    }
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    // Format phone number
    const formattedPhone = formatPhoneForSMS(message.to);
    
    // Validate phone number
    if (!isValidForSMS(formattedPhone)) {
      return {
        success: false,
        error: `Invalid phone number: ${message.to}`,
        provider: this.config.provider
      };
    }

    // Send message with formatted phone
    return this.provider.sendSMS({
      ...message,
      to: formattedPhone
    });
  }

  /**
   * Send multiple SMS messages
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<BulkSMSResult> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendSMS(message))
    );

    const processedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
          provider: this.config.provider
        };
      }
    });

    const successful = processedResults.filter(r => r.success).length;
    const failed = processedResults.filter(r => !r.success).length;

    return {
      successful,
      failed,
      results: processedResults
    };
  }

  /**
   * Get the current provider name
   */
  getProvider(): string {
    return this.config.provider;
  }
}