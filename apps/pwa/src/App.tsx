import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { useEffect } from 'react'
import { staffAuth } from './lib/staffAuth'

// Pages
import CheckInPage from './pages/CheckIn'
import ProfilePage from './pages/Profile'
import HistoryPage from './pages/History'
import EmergencyPage from './pages/Emergency'
import { AuthPage } from './pages/Auth'
import { InvitePage } from './pages/Invite'
import { OnboardingPage } from './pages/Onboarding'
import { WelcomePage } from './pages/Welcome'

// Layout
import Layout from './components/Layout'

function App() {
  const { user, loading, initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // Check for worker session on app load
    const checkWorkerSession = async () => {
      const session = await staffAuth.getSession()
      if (session) {
        // Worker is authenticated, restore session
        console.log('Worker session restored:', session)
      }
    }
    checkWorkerSession()
  }, [])

  // Check if this is a public route
  const isWelcomeRoute = location.pathname === '/' || location.pathname === '/welcome'
  const isInvitationRoute = location.pathname.startsWith('/invite')
  const isOnboardingRoute = location.pathname === '/onboarding'
  const isAuthRoute = location.pathname === '/auth'
  const isPublicRoute = isWelcomeRoute || isInvitationRoute || isOnboardingRoute || isAuthRoute

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/safeping-logo-full.png" alt="SafePing" className="h-16 mx-auto mb-6" />
          <div className="w-8 h-8 border-4 border-[#15a2a6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SafePing...</p>
        </div>
      </div>
    )
  }

  // Public routes (no auth required)
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Check for worker session
  const staffSession = staffAuth.getSession()
  const isAuthenticated = staffSession || user

  // Not authenticated - show welcome page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Authenticated - show main app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CheckInPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
