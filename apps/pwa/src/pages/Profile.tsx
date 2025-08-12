import { useAuthStore } from '../store/auth'
import { offlineStore } from '../lib/offline'
import { useState, useEffect } from 'react'
import { User, Phone, Mail, Building, Briefcase, Wifi, WifiOff, Database } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [storageInfo, setStorageInfo] = useState({
    pendingCheckIns: 0,
    cachedUsers: 0,
    syncQueueItems: 0
  })
  const [isOnline] = useState(navigator.onLine)

  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await offlineStore.getStorageInfo()
      setStorageInfo(info)
    }
    
    loadStorageInfo()
    
    // Refresh storage info every 30 seconds
    const interval = setInterval(loadStorageInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-center text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="text-white" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-sm text-gray-600 capitalize">{user.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-3">
          {user.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
              </div>
            </div>
          )}
          
          {user.email && (
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Work Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Work Information</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Building className="text-gray-400" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-900">Organization</p>
              <p className="text-sm text-gray-600">{user.organization_id}</p>
            </div>
          </div>
          
          {user.job_title && (
            <div className="flex items-center space-x-3">
              <Briefcase className="text-gray-400" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-900">Job Title</p>
                <p className="text-sm text-gray-600">{user.job_title}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">App Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="text-green-500" size={20} />
              ) : (
                <WifiOff className="text-red-500" size={20} />
              )}
              <span className="text-sm font-medium text-gray-900">Connection</span>
            </div>
            <span className={`text-sm font-medium ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="text-gray-400" size={20} />
              <span className="text-sm font-medium text-gray-900">Pending Check-ins</span>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {storageInfo.pendingCheckIns}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {user.emergency_contact_name && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4">Emergency Contact</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-800">{user.emergency_contact_name}</p>
            {user.emergency_contact_phone && (
              <p className="text-sm text-red-700">{user.emergency_contact_phone}</p>
            )}
          </div>
        </div>
      )}

      {/* App Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">SafePing Staff App</p>
          <p className="text-xs text-gray-500 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}