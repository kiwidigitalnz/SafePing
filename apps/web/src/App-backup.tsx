import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { AuthLayout } from './components/layouts/AuthLayout'
import { DashboardLayout } from './components/layouts/DashboardLayout'
import { SignIn } from './pages/auth/SignIn'
import { SignUp } from './pages/auth/SignUp'
import { VerifyCode } from './pages/auth/VerifyCode'
import { Onboarding } from './pages/auth/Onboarding'
import { AcceptInvitation } from './pages/auth/AcceptInvitation'
import { Dashboard } from './pages/Dashboard'
import { Staff } from './pages/Staff'
import { CheckIns } from './pages/CheckIns'
import { Schedules } from './pages/Schedules'
import { Incidents } from './pages/Incidents'
import { Settings } from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth/*"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="verify" element={<VerifyCode />} />
            <Route path="accept-invitation" element={<AcceptInvitation />} />
          </Route>
          
          {/* Onboarding route - separate from auth layout */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="staff" element={<Staff />} />
            <Route path="checkins" element={<CheckIns />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="settings" element={<Settings />} />
            <Route path="" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App