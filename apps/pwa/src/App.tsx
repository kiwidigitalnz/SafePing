import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { useEffect } from 'react'
import { workerAuth } from './lib/workerAuth'

// Pages
import CheckInPage from './pages/CheckIn'
import AuthPage from './pages/Auth'
import ProfilePage from './pages/Profile'
import HistoryPage from './pages/History'
import EmergencyPage from './pages/Emergency'
import { WorkerAuth } from './pages/WorkerAuth'

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

  // Handle invitation links (e.g., /invite?token=xxx)
  const isInvitationLink = location.pathname === '/invite' || 
                          location.search.includes('token=')

  if (loading) {
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

  // Handle invitation/worker auth flow
  if (isInvitationLink) {
    return <WorkerAuth />
  }

  // Check for worker session
  const workerSession = workerAuth.getSession()
  if (workerSession) {
    // Worker authenticated via PIN/Biometric
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<CheckInPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/auth/worker" element={<WorkerAuth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  // For PWA, always use WorkerAuth for authentication
  if (!user) {
    return <WorkerAuth />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CheckInPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/auth/worker" element={<WorkerAuth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
