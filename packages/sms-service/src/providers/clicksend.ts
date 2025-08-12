/**
 * ClickSend SMS Provider
 */

import type { SMSConfig, SMSMessage, SMSResult, SMSProvider } from '../types';

export class ClickSendProvider implements SMSProvider {
  private username: string;
  private apiKey: string;
  private baseUrl = 'https://rest.clicksend.com/v3/sms/send';

  constructor(config: SMSConfig) {
    if (!config.username || !config.apiKey) {
      throw new Error('ClickSend requires username and apiKey');
    }
    this.username = config.username;
    this.apiKey = config.apiKey;
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.apiKey}`)
        },
        body: JSON.stringify({
          messages: [{
            to: message.to,
            body: message.message,
            from: message.from || 'SafePing'
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.response_msg || 'Failed to send SMS');
      }

      const messageData = data.data.messages[0];
      
      return {
        success: messageData.status === 'SUCCESS',
        messageId: messageData.message_id,
        cost: messageData.message_price,
        error: messageData.status !== 'SUCCESS' ? messageData.status : undefined,
        provider: 'clicksend'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'clicksend'
      };
    }
  }
}