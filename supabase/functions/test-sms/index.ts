import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestSMSRequest {
  phoneNumber: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: TestSMSRequest = await req.json()
    const { phoneNumber, message = 'Test message from SafePing - SMS service is working correctly!' } = body

    console.log(`Testing SMS to ${phoneNumber}`)

    // Get SMS configuration
    const smsConfig = getSMSConfig()
    if (!smsConfig) {
      throw new Error('SMS service not configured')
    }

    console.log(`SMS Provider: ${smsConfig.provider}`)

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log(`Formatted phone: ${formattedPhone}`)

    if (!isValidPhoneNumber(formattedPhone)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`)
    }

    // Initialize SMS service
    const smsService = new SMSService(smsConfig)

    // Send test SMS
    const result = await smsService.sendSMS({
      to: formattedPhone,
      message: message
    })

    console.log(`SMS Result:`, result)

    return new Response(
      JSON.stringify({
        success: true,
        provider: smsConfig.provider,
        to: formattedPhone,
        original_number: phoneNumber,
        sms_result: result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('SMS test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To test:
curl -i --location --request POST 'http://localhost:54321/functions/v1/test-sms' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phoneNumber": "+64212345678",
    "message": "Test SMS from SafePing"
  }'
*/