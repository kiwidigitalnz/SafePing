/**
 * SMS Service implementation for Edge Functions
 */

export interface SMSConfig {
  provider: 'clicksend' | 'twilio'
  username?: string
  apiKey?: string
  accountSid?: string
  authToken?: string
  fromNumber?: string
}

export interface SMSMessage {
  to: string
  message: string
  from?: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  cost?: number
  provider: string
}

export interface BulkSMSResult {
  successful: number
  failed: number
  results: SMSResult[]
}

export class SMSService {
  private config: SMSConfig

  constructor(config: SMSConfig) {
    this.config = config
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    switch (this.config.provider) {
      case 'clicksend':
        return this.sendClickSend(message)
      case 'twilio':
        return this.sendTwilio(message)
      default:
        return {
          success: false,
          error: `Unsupported provider: ${this.config.provider}`,
          provider: this.config.provider
        }
    }
  }

  private async sendClickSend(message: SMSMessage): Promise<SMSResult> {
    if (!this.config.username || !this.config.apiKey) {
      return {
        success: false,
        error: 'ClickSend credentials not configured',
        provider: 'clicksend'
      }
    }

    const auth = btoa(`${this.config.username}:${this.config.apiKey}`)
    
    try {
      const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            to: message.to,
            body: message.message,
            from: message.from || this.config.fromNumber || 'SafePing'
          }]
        })
      })

      const data = await response.json()

      if (response.ok && data.data?.messages?.[0]) {
        const msg = data.data.messages[0]
        return {
          success: msg.status === 'SUCCESS',
          messageId: msg.message_id,
          cost: msg.message_price,
          error: msg.status !== 'SUCCESS' ? msg.status : undefined,
          provider: 'clicksend'
        }
      }

      return {
        success: false,
        error: data.response_msg || 'Failed to send SMS',
        provider: 'clicksend'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'clicksend'
      }
    }
  }

  private async sendTwilio(message: SMSMessage): Promise<SMSResult> {
    if (!this.config.accountSid || !this.config.authToken) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
        provider: 'twilio'
      }
    }

    const auth = btoa(`${this.config.accountSid}:${this.config.authToken}`)
    
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: message.to,
            Body: message.message,
            From: message.from || this.config.fromNumber || ''
          })
        }
      )

      const data = await response.json()

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
          cost: data.price ? parseFloat(data.price) : undefined,
          provider: 'twilio'
        }
      }

      return {
        success: false,
        error: data.message || 'Failed to send SMS',
        provider: 'twilio'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      }
    }
  }
}

export function getSMSConfig(): SMSConfig | null {
  const provider = Deno.env.get('SMS_PROVIDER') as 'clicksend' | 'twilio'
  
  if (!provider) {
    return null
  }

  switch (provider) {
    case 'clicksend':
      return {
        provider: 'clicksend',
        username: Deno.env.get('CLICKSEND_USERNAME'),
        apiKey: Deno.env.get('CLICKSEND_API_KEY')
      }
    case 'twilio':
      return {
        provider: 'twilio',
        accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
        authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
        fromNumber: Deno.env.get('TWILIO_FROM_NUMBER')
      }
    default:
      return null
  }
}