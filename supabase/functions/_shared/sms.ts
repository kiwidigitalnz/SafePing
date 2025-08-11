/**
 * SMS Service for Supabase Edge Functions
 * Server-side SMS integration with ClickSend and Twilio
 */

export interface SMSConfig {
  provider: 'clicksend' | 'twilio'
  apiKey?: string
  apiSecret?: string
  username?: string
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
  cost?: number
  error?: string
}

/**
 * ClickSend SMS Service
 */
class ClickSendService {
  private username: string
  private apiKey: string

  constructor(config: SMSConfig) {
    if (!config.username || !config.apiKey) {
      throw new Error('ClickSend requires username and apiKey')
    }
    this.username = config.username
    this.apiKey = config.apiKey
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.response_msg || 'Failed to send SMS')
      }

      const messageData = data.data.messages[0]
      
      return {
        success: messageData.status === 'SUCCESS',
        messageId: messageData.message_id,
        cost: messageData.message_price,
        error: messageData.status !== 'SUCCESS' ? messageData.status : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Twilio SMS Service
 */
class TwilioService {
  private accountSid: string
  private authToken: string
  private fromNumber: string

  constructor(config: SMSConfig) {
    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new Error('Twilio requires accountSid, authToken, and fromNumber')
    }
    this.accountSid = config.accountSid
    this.authToken = config.authToken
    this.fromNumber = config.fromNumber
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
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
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send SMS')
      }

      return {
        success: true,
        messageId: data.sid,
        error: data.error_code ? data.error_message : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Main SMS Service Factory
 */
export class SMSService {
  private service: ClickSendService | TwilioService

  constructor(config: SMSConfig) {
    switch (config.provider) {
      case 'clicksend':
        this.service = new ClickSendService(config)
        break
      case 'twilio':
        this.service = new TwilioService(config)
        break
      default:
        throw new Error(`Unsupported SMS provider: ${config.provider}`)
    }
  }

  async sendSMS(message: SMSMessage): Promise<SMSResult> {
    return this.service.sendSMS(message)
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendSMS(message))
    )

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: result.reason?.message || 'Unknown error' }
    )
  }
}

/**
 * Get SMS configuration from environment variables
 */
export function getSMSConfig(): SMSConfig | null {
  const provider = Deno.env.get('SMS_PROVIDER') as 'clicksend' | 'twilio'
  
  if (!provider) {
    console.warn('No SMS provider configured')
    return null
  }

  switch (provider) {
    case 'clicksend':
      const clicksendUsername = Deno.env.get('CLICKSEND_USERNAME')
      const clicksendApiKey = Deno.env.get('CLICKSEND_API_KEY')
      
      if (!clicksendUsername || !clicksendApiKey) {
        console.warn('ClickSend credentials not configured')
        return null
      }
      
      return {
        provider: 'clicksend',
        username: clicksendUsername,
        apiKey: clicksendApiKey
      }
      
    case 'twilio':
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER')
      
      if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
        console.warn('Twilio credentials not configured')
        return null
      }
      
      return {
        provider: 'twilio',
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
        fromNumber: twilioFromNumber
      }
      
    default:
      console.warn(`Unsupported SMS provider: ${provider}`)
      return null
  }
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '+64'): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // If it already starts with +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // If it starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return defaultCountryCode + cleaned.substring(1)
  }
  
  // If it doesn't start with +, add country code
  return defaultCountryCode + cleaned
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}