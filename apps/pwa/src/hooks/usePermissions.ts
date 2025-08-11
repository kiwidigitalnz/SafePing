import { useState, useEffect } from 'react'

export type PermissionType = 'notifications' | 'geolocation' | 'camera'

interface PermissionStatus {
  notifications: NotificationPermission | 'unsupported'
  geolocation: PermissionState | 'unsupported'
  camera: PermissionState | 'unsupported'
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    notifications: 'default',
    geolocation: 'prompt',
    camera: 'prompt'
  })

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    const newPermissions: PermissionStatus = {
      notifications: 'unsupported',
      geolocation: 'unsupported',
      camera: 'unsupported'
    }

    // Check notifications permission
    if ('Notification' in window) {
      newPermissions.notifications = Notification.permission
    }

    // Check geolocation permission
    if ('permissions' in navigator) {
      try {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' })
        newPermissions.geolocation = geoPermission.state
        
        geoPermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, geolocation: geoPermission.state }))
        })
      } catch (error) {
        console.log('Geolocation permission check failed:', error)
      }

      // Check camera permission
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        newPermissions.camera = cameraPermission.state
        
        cameraPermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }))
        })
      } catch (error) {
        console.log('Camera permission check failed:', error)
      }
    }

    setPermissions(newPermissions)
  }

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissions(prev => ({ ...prev, notifications: permission }))
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const requestGeolocationPermission = async (): Promise<boolean> => {
    if (!('geolocation' in navigator)) {
      console.log('Geolocation is not supported')
      return false
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions(prev => ({ ...prev, geolocation: 'granted' }))
          resolve(true)
        },
        () => {
          setPermissions(prev => ({ ...prev, geolocation: 'denied' }))
          resolve(false)
        }
      )
    })
  }

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setPermissions(prev => ({ ...prev, camera: 'granted' }))
      return true
    } catch (error) {
      setPermissions(prev => ({ ...prev, camera: 'denied' }))
      return false
    }
  }

  return {
    permissions,
    requestNotificationPermission,
    requestGeolocationPermission,
    requestCameraPermission,
    checkPermissions
  }
}
