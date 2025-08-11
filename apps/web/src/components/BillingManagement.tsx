import { useState, useEffect } from 'react'
import { 
  subscriptionService, 
  formatPrice, 
  formatDate, 
  getSubscriptionStatusColor, 
  getSubscriptionStatusText,
  type SubscriptionPlan,
  type OrganizationSubscription,
  type BillingEvent
} from '../lib/stripe'

export function BillingManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<OrganizationSubscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [plansData, subscriptionData, historyData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getBillingHistory()
      ])

      setPlans(plansData)
      setCurrentSubscription(subscriptionData)
      setBillingHistory(historyData)
    } catch (err) {
      console.error('Error loading billing data:', err)
      setError('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    try {
      setActionLoading(planId)
      setError(null)

      const { url } = await subscriptionService.createCheckoutSession(planId)
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError('Failed to start subscription process')
    } finally {
      setActionLoading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setActionLoading('portal')
      setError(null)

      const { url } = await subscriptionService.createPortalSession()
      
      // Open Stripe Customer Portal
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error opening billing portal:', err)
      setError('Failed to open billing portal')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.')) {
      return
    }

    try {
      setActionLoading('cancel')
      setError(null)

      await subscriptionService.cancelSubscription()
      await loadBillingData() // Refresh data
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError('Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Current Subscription */}
      {currentSubscription ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium">{currentSubscription.plan_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionStatusColor(currentSubscription.status)}`}>
                {getSubscriptionStatusText(currentSubscription.status)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Staff Limit</p>
              <p className="font-medium">{currentSubscription.max_staff === 999999 ? 'Unlimited' : currentSubscription.max_staff}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {currentSubscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
              </p>
              <p className="font-medium">
                {formatDate(currentSubscription.status === 'trialing' && currentSubscription.trial_end 
                  ? currentSubscription.trial_end 
                  : currentSubscription.current_period_end
                )}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'portal' ? 'Opening...' : 'Manage Billing'}
            </button>
            
            {currentSubscription.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>

          {/* Features */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-900 mb-2">Included Features</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              {Object.entries(currentSubscription.features).map(([feature, enabled]) => (
                enabled && (
                  <div key={feature} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* No Subscription - Show Plans */
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-lg p-6 relative">
                {plan.name === 'Professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price_cents)}
                    </span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Up to {plan.max_staff === 999999 ? 'unlimited' : plan.max_staff} staff
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {Object.entries(plan.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center text-sm">
                      <span className={`mr-3 ${enabled ? 'text-green-500' : 'text-gray-300'}`}>
                        {enabled ? '✓' : '✗'}
                      </span>
                      <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={actionLoading === plan.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium ${
                    plan.name === 'Professional'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading === plan.id ? 'Starting...' : 'Start 14-Day Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(event.processed_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.amount_cents ? formatPrice(event.amount_cents, event.currency || 'NZD') : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        event.status === 'succeeded' ? 'text-green-600 bg-green-100' :
                        event.status === 'failed' ? 'text-red-600 bg-red-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {event.status || 'Processing'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}