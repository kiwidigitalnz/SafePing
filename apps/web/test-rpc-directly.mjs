// Test the verify_code RPC function directly
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcmtcegxebspzjrrgvtn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXRjZWd4ZWJzcHpqcnJndnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNjQ4MTYsImV4cCI6MjA2ODY0MDgxNn0.A8sK6tJEiskdVLt3vT67oKtyHByMdkQVQOA5AS91zOI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRPC() {
  try {
    console.log('🧪 Testing verify_code RPC function directly...')
    
    const { data, error } = await supabase
      .rpc('verify_code', {
        p_email: 'richard@kiwidigital.biz',
        p_code: '360834',
        p_type: 'signup_verification'
      })
    
    console.log('✅ RPC Response:')
    console.log('Data:', JSON.stringify(data, null, 2))
    console.log('Error:', error)
    
    if (data && data.length > 0) {
      console.log('🔍 First result:', JSON.stringify(data[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ RPC Test failed:', error)
  }
}

testRPC()
