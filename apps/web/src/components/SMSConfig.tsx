import React, { useState, useEffect } from 'react'
import { MessageSquare, Save, TestTube, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SMSConfigData {
  provider: 'clicksend' | 'twilio' | null
  clicksend_username?: string
  clicksend_api_key?: string
  twilio_account_sid?: string
  twilio_auth_token?: string
  twilio_from_number?: string
  test_number?: string
}

export function SMSConfig() {
  const [config, setConfig] = useState<SMSConfigData>({
    provider: null
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // In a real implementation, you would load this from a secure settings table
      // For now, we'll just show the form
      console.log('Loading SMS configuration...')
    } catch (error) {
      console.error('Error loading SMS config:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)

    try {
      // Validate required fields
      if (!config.provider) {
        throw new Error('Please select an SMS provider')
      }

      if (config.provider === 'clicksend') {
        if (!config.clicksend_username || !config.clicksend_api_key) {
          throw new Error('ClickSend username and API key are required')
        }
      } else if (config.provider === 'twilio') {
        if (!config.twilio_account_sid || !config.twilio_auth_token || !config.twilio_from_number) {
          throw new Error('Twilio Account SID, Auth Token, and From Number are required')
        }
      }

      // In a real implementation, you would save this to a secure settings table
      // and update environment variables for the Edge Functions
      console.log('SMS configuration saved:', config)
      
      setTestResult({
        success: true,
        message: 'SMS configuration saved successfully. Please update your environment variables.'
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save configuration'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!config.test_number) {
      setTestResult({
        success: false,
        message: 'Please enter a test phone number'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Test SMS by calling the escalation function with test data
      const { data, error } = await supabase.functions.invoke('trigger-escalation', {
        body: {
          userId: 'test-user-id',
          scheduleId: 'test-schedule-id',
          organizationId: 'test-org-id',
          overdueBy: 5,
          type: 'test',
          testPhoneNumber: config.test_number
        }
      })

      if (error) {
        throw error
      }

      setTestResult({
        success: true,
        message: `Test SMS sent successfully to ${config.test_number}`
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test SMS'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            SMS Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Configure SMS provider for emergency notifications and escalations
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMS Provider
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="provider"
                value="clicksend"
                checked={config.provider === 'clicksend'}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as 'clicksend' })}
                className="text-primary focus:ring-primary"
              />
              <div>
                <div className="font-medium">ClickSend</div>
                <div className="text-sm text-gray-500">Global SMS service</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="provider"
                value="twilio"
                checked={config.provider === 'twilio'}
                onChange={(e) => setConfig({ ...config, provider: e.target.value as 'twilio' })}
                className="text-primary focus:ring-primary"
              />
              <div>
                <div className="font-medium">Twilio</div>
                <div className="text-sm text-gray-500">Enterprise SMS platform</div>
              </div>
            </label>
          </div>
        </div>

        {/* ClickSend Configuration */}
        {config.provider === 'clicksend' && (
          <div className="space-y-4 border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900">ClickSend Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={config.clicksend_username || ''}
                  onChange={(e) => setConfig({ ...config, clicksend_username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your ClickSend username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={config.clicksend_api_key || ''}
                  onChange={(e) => setConfig({ ...config, clicksend_api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your ClickSend API key"
                />
              </div>
            </div>
          </div>
        )}

        {/* Twilio Configuration */}
        {config.provider === 'twilio' && (
          <div className="space-y-4 border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900">Twilio Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account SID
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={config.twilio_account_sid || ''}
                  onChange={(e) => setConfig({ ...config, twilio_account_sid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your Twilio Account SID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token
                </label>
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={config.twilio_auth_token || ''}
                  onChange={(e) => setConfig({ ...config, twilio_auth_token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your Twilio Auth Token"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Number
                </label>
                <input
                  type="text"
                  value={config.twilio_from_number || ''}
                  onChange={(e) => setConfig({ ...config, twilio_from_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+64021234567"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Twilio phone number (must include country code)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show/Hide Credentials Toggle */}
        {config.provider && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCredentials}
                onChange={(e) => setShowCredentials(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">Show credentials</span>
            </label>
          </div>
        )}

        {/* Test Configuration */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Test Configuration</h4>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Phone Number
              </label>
              <input
                type="text"
                value={config.test_number || ''}
                onChange={(e) => setConfig({ ...config, test_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+64021234567"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your phone number to test SMS delivery
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleTest}
                disabled={testing || !config.provider || !config.test_number}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? 'Testing...' : 'Test SMS'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`border rounded-lg p-4 ${
            testResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'Success' : 'Error'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !config.provider}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* Environment Variables Instructions */}
        {config.provider && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Environment Variables</h4>
            <p className="text-sm text-gray-600 mb-3">
              Add these environment variables to your Supabase project settings:
            </p>
            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
              <div>SMS_PROVIDER={config.provider}</div>
              {config.provider === 'clicksend' && (
                <>
                  <div>CLICKSEND_USERNAME={config.clicksend_username || 'your_username'}</div>
                  <div>CLICKSEND_API_KEY={config.clicksend_api_key || 'your_api_key'}</div>
                </>
              )}
              {config.provider === 'twilio' && (
                <>
                  <div>TWILIO_ACCOUNT_SID={config.twilio_account_sid || 'your_account_sid'}</div>
                  <div>TWILIO_AUTH_TOKEN={config.twilio_auth_token || 'your_auth_token'}</div>
                  <div>TWILIO_FROM_NUMBER={config.twilio_from_number || 'your_from_number'}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}