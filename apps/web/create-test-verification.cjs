const { createClient } = require('@supabase/supabase-js')

// Use production Supabase credentials
const supabaseUrl = 'https://zcmtcegxebspzjrrgvtn.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestVerification() {
  try {
    const testEmail = 'richard@kiwidigital.biz'
    
    console.log('🔄 Creating fresh verification code for testing...')
    
    // First, clean up any existing verification codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', testEmail)
      .eq('type', 'signup_verification')
    
    console.log('✅ Cleaned up existing codes')
    
    // Create a fresh verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    
    const { data: codeData, error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email: testEmail,
        code: verificationCode,
        type: 'signup_verification',
        expires_at: expiresAt.toISOString(),
        metadata: {
          organization_name: 'Kiwi Digital Ltd',
          first_name: 'Richard',
          last_name: 'Barley',
          slug: 'kiwi-digital-ltd',
          password: 'TestPassword123!' // For testing
        }
      })
      .select()
      .single()
    
    if (codeError) {
      console.error('❌ Error creating verification code:', codeError)
      return
    }
    
    console.log('✅ Created verification code:', verificationCode)
    console.log('📧 Email:', testEmail)
    console.log('⏰ Expires at:', expiresAt.toISOString())
    console.log('🆔 Code ID:', codeData.id)
    
    // Create corresponding pending organization
    const { data: pendingOrg, error: pendingError } = await supabase
      .from('pending_organizations')
      .insert({
        verification_code_id: codeData.id,
        name: 'Kiwi Digital Ltd',
        slug: 'kiwi-digital-ltd',
        admin_email: testEmail,
        admin_first_name: 'Richard',
        admin_last_name: 'Barley'
      })
      .select()
      .single()
    
    if (pendingError) {
      console.error('❌ Error creating pending organization:', pendingError)
      return
    }
    
    console.log('✅ Created pending organization:', pendingOrg.name)
    console.log('')
    console.log('🧪 Test with this code:', verificationCode)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestVerification()
