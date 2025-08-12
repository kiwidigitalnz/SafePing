import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { useEffect } from 'react'
import { workerAuth } from './lib/workerAuth'

// Pages
import CheckInPage from './pages/CheckIn'
import ProfilePage from './pages/Profile'
import HistoryPage from './pages/History'
import EmergencyPage from './pages/Emergency'
import { WorkerAuth } from './pages/WorkerAuth'
import { StaffInvite } from './pages/StaffInvite'
import { StaffSetup } from './pages/StaffSetup'
import { StaffOnboarding } from './pages/StaffOnboarding'

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
      const session = await workerAuth.getSession()
      if (session) {
        // Worker is authenticated, restore session
        console.log('Worker session restored:', session)
      }
    }
    checkWorkerSession()
  }, [])

  // Check if this is an invitation, setup, or onboarding route
  const isInvitationRoute = location.pathname.startsWith('/invite')
  const isSetupRoute = location.pathname === '/setup'
  const isOnboardingRoute = location.pathname === '/onboarding'
  const isPublicRoute = isInvitationRoute || isSetupRoute || isOnboardingRoute

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.svg" alt="SafePing" className="w-16 h-16 mx-auto mb-4" />
          <div className="w-8 h-8 border-4 border-[#1A9B9C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SafePing...</p>
        </div>
      </div>
    )
  }

  // Public routes (no auth required)
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<StaffInvite />} />
        <Route path="/invite" element={<StaffInvite />} />
        <Route path="/setup" element={<StaffSetup />} />
        <Route path="/onboarding" element={<StaffOnboarding />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  // Check for worker session
  const workerSession = workerAuth.getSession()
  const isAuthenticated = workerSession || user

  // Not authenticated - show auth page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<WorkerAuth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
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
