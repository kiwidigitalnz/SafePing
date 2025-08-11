/**
 * Email Service for Supabase Edge Functions
 * Server-side email integration with Resend
 */

export interface EmailConfig {
  provider: 'resend'
  apiKey: string
  fromEmail?: string
  fromName?: string
}

export interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Resend Email Service
 */
class ResendService {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(config: EmailConfig) {
    if (!config.apiKey) {
      throw new Error('Resend requires apiKey')
    }
    this.apiKey = config.apiKey
    this.fromEmail = config.fromEmail || 'noreply@safeping.app'
    this.fromName = config.fromName || 'SafePing Safety Alerts'
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: message.from || `${this.fromName} <${this.fromEmail}>`,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text || this.htmlToText(message.html || '')
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email')
      }

      return {
        success: true,
        messageId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }
}

/**
 * Main Email Service Factory
 */
export class EmailService {
  private service: ResendService

  constructor(config: EmailConfig) {
    switch (config.provider) {
      case 'resend':
        this.service = new ResendService(config)
        break
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`)
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    return this.service.sendEmail(message)
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailResult[]> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendEmail(message))
    )

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: result.reason?.message || 'Unknown error' }
    )
  }
}

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig | null {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured')
    return null
  }

  return {
    provider: 'resend',
    apiKey,
    fromEmail: Deno.env.get('RESEND_FROM_EMAIL'),
    fromName: Deno.env.get('RESEND_FROM_NAME')
  }
}

/**
 * Email templates for safety alerts
 */
export const EmailTemplates = {
  /**
   * Generate safety alert email template
   */
  safetyAlert: (params: {
    workerName: string
    overdueTime: number
    alertLevel: string
    organizationName?: string
    scheduleInfo?: string
    actionRequired?: string
  }) => {
    const { workerName, overdueTime, alertLevel, organizationName, scheduleInfo, actionRequired } = params
    
    const urgencyColor = alertLevel === 'emergency' ? '#dc2626' : 
                        alertLevel === 'high' ? '#ea580c' : 
                        alertLevel === 'medium' ? '#d97706' : '#65a30d'
    
    const subject = `🚨 SAFETY ALERT: ${workerName} - ${overdueTime} minutes overdue`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SafePing Safety Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🚨 SAFETY ALERT</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Worker Check-in Overdue</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background-color: #fef2f2; border-left: 4px solid ${urgencyColor}; padding: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0; color: ${urgencyColor}; font-size: 20px;">
                  ${workerName} is overdue for safety check-in
                </h2>
                <p style="margin: 0; font-size: 16px;">
                  <strong>Overdue by:</strong> ${overdueTime} minutes<br>
                  <strong>Alert Level:</strong> ${alertLevel.toUpperCase()}
                  ${organizationName ? `<br><strong>Organization:</strong> ${organizationName}` : ''}
                  ${scheduleInfo ? `<br><strong>Schedule:</strong> ${scheduleInfo}` : ''}
                </p>
              </div>
              
              <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">Immediate Action Required</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Contact ${workerName} immediately via phone</li>
                  <li>Verify their current location and safety status</li>
                  <li>If unable to reach them, initiate emergency protocols</li>
                  ${actionRequired ? `<li>${actionRequired}</li>` : ''}
                </ul>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">Next Steps:</h4>
                <ol style="margin: 0; padding-left: 20px;">
                  <li>Log into your SafePing dashboard to see real-time status</li>
                  <li>Update the incident status once contact is made</li>
                  <li>Document any safety concerns or issues found</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('APP_URL') || 'https://safeping.app'}/dashboard" 
                   style="background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Dashboard
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                This is an automated safety alert from SafePing.<br>
                Alert generated at ${new Date().toLocaleString()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                SafePing - Keeping your workers safe, always.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
    
    return { subject, html }
  },

  /**
   * Generate incident resolution email template
   */
  incidentResolved: (params: {
    workerName: string
    resolvedBy: string
    resolutionNotes?: string
    organizationName?: string
  }) => {
    const { workerName, resolvedBy, resolutionNotes, organizationName } = params
    
    const subject = `✅ RESOLVED: ${workerName} safety alert cleared`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SafePing Alert Resolved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">✅ ALERT RESOLVED</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Safety Alert Cleared</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0; color: #16a34a; font-size: 20px;">
                  ${workerName} safety alert has been resolved
                </h2>
                <p style="margin: 0; font-size: 16px;">
                  <strong>Resolved by:</strong> ${resolvedBy}<br>
                  <strong>Time:</strong> ${new Date().toLocaleString()}
                  ${organizationName ? `<br><strong>Organization:</strong> ${organizationName}` : ''}
                </p>
              </div>
              
              ${resolutionNotes ? `
                <div style="margin-bottom: 25px;">
                  <h3 style="margin: 0 0 15px 0; color: #1f2937;">Resolution Notes</h3>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0;">${resolutionNotes}</p>
                  </div>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get('APP_URL') || 'https://safeping.app'}/dashboard" 
                   style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Dashboard
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Alert resolved notification from SafePing.<br>
                Generated at ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `
    
    return { subject, html }
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
