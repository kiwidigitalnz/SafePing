import { useAuthStore } from '../store/auth'
import { subscriptionService } from '../lib/stripe'

export function TrialBanner() {
  const { subscription, isTrialExpired, daysUntilTrialExpires, isOrgAdmin } = useAuthStore()

  // Only show for org admins with trial subscriptions
  if (!subscription || subscription.status !== 'trialing' || !isOrgAdmin()) {
    return null
  }

  const isExpired = isTrialExpired()
  const daysLeft = daysUntilTrialExpires()

  const handleUpgrade = async () => {
    try {
      // Get starter plan for upgrade
      const plans = await subscriptionService.getPlans()
      const starterPlan = plans.find(p => p.name === 'Starter')
      
      if (starterPlan) {
        const { url } = await subscriptionService.createCheckoutSession(starterPlan.id)
        window.location.href = url
      }
    } catch (error) {
      console.error('Error starting upgrade:', error)
    }
  }

  if (isExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold">Trial Expired</p>
              <p className="text-sm opacity-90">
                Your free trial has ended. Upgrade now to continue using SafePing.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    )
  }

  if (daysLeft !== null && daysLeft <= 7) {
    return (
      <div className="bg-yellow-500 text-yellow-900 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-3">⏰</span>
            <div>
              <p className="font-semibold">Trial Ending Soon</p>
              <p className="text-sm">
                Your free trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. 
                Upgrade to continue using SafePing.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="bg-yellow-900 text-yellow-100 px-4 py-2 rounded font-medium hover:bg-yellow-800 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    )
  }

  return null
}