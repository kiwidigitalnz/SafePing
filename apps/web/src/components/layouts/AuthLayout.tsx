import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  // The new sign-in page has its own full layout, 
  // so we just render the outlet directly
  return <Outlet />
}
