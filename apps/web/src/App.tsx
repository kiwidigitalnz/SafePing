import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { AuthLayout } from './components/layouts/AuthLayout'
import { DashboardLayout } from './components/layouts/DashboardLayout'
import { SignIn } from './pages/auth/SignIn'
import { SignUp } from './pages/auth/SignUp'
import { VerifyCode } from './pages/auth/VerifyCode'
import { Onboarding } from './pages/auth/Onboarding'
import { AcceptInvitation } from './pages/auth/AcceptInvitation'
import { OAuthCallback } from './pages/auth/OAuthCallback'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { TermsOfService } from './pages/legal/TermsOfService'
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy'
import { Dashboard } from './pages/Dashboard'
import { Staff } from './pages/Staff'
import { CheckIns } from './pages/CheckIns'
import { Schedules } from './pages/Schedules'
import { Incidents } from './pages/Incidents'
import { Settings } from './pages/Settings'
import InviteStaffPage from './pages/workers/InviteStaff'

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
  const location = useLocation()
  
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
  
  // Check if user has completed setup (has organization_id)
  if (!user.organization_id) {
    // Allow access to onboarding page
    if (location.pathname === '/onboarding') {
      return <>{children}</>
    }
    // For users without organization, they need to complete signup/verification first
    // This should only happen if they somehow bypassed the normal flow
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
  
  // Simple logic: if user is authenticated and has organization_id, redirect to dashboard
  if (user && user.organization_id) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Allow access to public routes (including verify page for unverified users)
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
            <Route path="callback" element={<OAuthCallback />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
          
          {/* Onboarding route - separate from auth layout */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Legal pages - public routes */}
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="staff" element={<Staff />} />
            <Route path="staff/invite" element={<InviteStaffPage />} />
            <Route path="workers" element={<Staff />} />
            <Route path="workers/invite" element={<InviteStaffPage />} />
            <Route path="checkins" element={<CheckIns />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
