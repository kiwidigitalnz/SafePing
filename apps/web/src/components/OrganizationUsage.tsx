import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

interface UsageStats {
  totalStaff: number
  activeStaff: number
  activeSchedules: number
  recentCheckIns: number
  pendingIncidents: number
}

export function OrganizationUsage() {
  const { organization, user } = useAuthStore()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization_id) {
      loadUsageStats()
    }
  }, [user?.organization_id])

  const loadUsageStats = async () => {
    if (!user?.organization_id) return

    try {
      setLoading(true)

      // Get staff counts
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('organization_id', user.organization_id)
        .neq('role', 'super_admin')

      if (staffError) throw staffError

      // Get active schedules count
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)

      if (schedulesError) throw schedulesError

      // Get recent check-ins (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id')
        .eq('organization_id', user.organization_id)
        .gte('created_at', yesterday.toISOString())

      if (checkInsError) throw checkInsError

      // Get pending incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('status', 'open')

      if (incidentsError) throw incidentsError

      setStats({
        totalStaff: staffData?.length || 0,
        activeStaff: staffData?.filter(u => u.is_active)?.length || 0,
        activeSchedules: schedulesData?.length || 0,
        recentCheckIns: checkInsData?.length || 0,
        pendingIncidents: incidentsData?.length || 0,
      })
    } catch (error) {
      console.error('Error loading usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanDetails = () => {
    const plan = organization?.subscription_plan || 'basic'
    
    const planDetails = {
      basic: { name: 'Starter', maxStaff: 10, price: '$4.90' },
      professional: { name: 'Professional', maxStaff: 50, price: '$3.90' },
      enterprise: { name: 'Enterprise', maxStaff: 500, price: 'Custom' },
    }

    return planDetails[plan as keyof typeof planDetails] || planDetails.basic
  }

  const getTrialInfo = () => {
    if (!organization?.trial_ends_at) return null

    const trialEnd = new Date(organization.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return { trialEnd, daysLeft }
  }

  const planDetails = getPlanDetails()
  const trialInfo = getTrialInfo()
  const isTrialActive = organization?.subscription_status === 'trial'

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Usage & Subscription</h3>
        <p className="mt-1 text-sm text-gray-600">
          Current plan usage and subscription information
        </p>
      </div>

      <div className="px-6 py-4">
        {/* Subscription Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">
                {planDetails.name} Plan
              </h4>
              <p className="text-sm text-gray-600">
                {planDetails.price} per staff member per month
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isTrialActive 
                  ? 'bg-yellow-100 text-yellow-800'
                  : organization?.subscription_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {isTrialActive ? 'Trial' : organization?.subscription_status || 'Unknown'}
              </span>
            </div>
          </div>

          {isTrialActive && trialInfo && (
            <div className={`p-3 rounded-md ${
              trialInfo.daysLeft <= 3 
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={`text-sm font-medium ${
                trialInfo.daysLeft <= 3 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {trialInfo.daysLeft > 0 
                  ? `Trial expires in ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'}`
                  : 'Trial has expired'
                }
              </p>
              <p className={`text-sm ${
                trialInfo.daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                Upgrade to continue using SafePing after your trial ends
              </p>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.activeStaff}/{stats?.totalStaff}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Schedules</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.activeSchedules}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Recent Check-ins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.recentCheckIns}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.pendingIncidents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Limits */}
        <div className="border-t border-gray-200 pt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Plan Limits</h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Staff Members</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.totalStaff} / {planDetails.maxStaff}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (stats?.totalStaff || 0) / planDetails.maxStaff > 0.8 
                      ? 'bg-red-500' 
                      : (stats?.totalStaff || 0) / planDetails.maxStaff > 0.6 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(((stats?.totalStaff || 0) / planDetails.maxStaff) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {isTrialActive && (
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Upgrade Plan
              </button>
            )}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              View Billing
            </button>
            <button 
              onClick={loadUsageStats}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}