import { v4 as uuidv4 } from 'uuid'

interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  deviceModel: string
  osVersion: string
  appVersion: string
  userAgent: string
  biometricType?: string
}

export function getDeviceId(): string {
  // Check if device ID already exists
  let deviceId = localStorage.getItem('device_id')
  
  if (!deviceId) {
    // Generate new device ID
    deviceId = uuidv4()
    localStorage.setItem('device_id', deviceId)
  }
  
  return deviceId!
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = 'mobile'
  } else if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = 'tablet'
  }
  
  // Detect device model and OS
  let deviceModel = 'Unknown Device'
  let osVersion = 'Unknown OS'
  
  // iOS Detection
  if (/iPhone/.test(userAgent)) {
    deviceModel = 'iPhone'
    const match = userAgent.match(/OS (\d+)_(\d+)/)
    if (match) {
      osVersion = `iOS ${match[1]}.${match[2]}`
    }
  }
  // iPad Detection
  else if (/iPad/.test(userAgent)) {
    deviceModel = 'iPad'
    const match = userAgent.match(/OS (\d+)_(\d+)/)
    if (match) {
      osVersion = `iPadOS ${match[1]}.${match[2]}`
    }
  }
  // Android Detection
  else if (/Android/.test(userAgent)) {
    const deviceMatch = userAgent.match(/Android.*; (.+?) Build/)
    if (deviceMatch) {
      deviceModel = deviceMatch[1]
    }
    const versionMatch = userAgent.match(/Android (\d+\.?\d*)/)
    if (versionMatch) {
      osVersion = `Android ${versionMatch[1]}`
    }
  }
  // Windows Detection
  else if (/Windows/.test(userAgent)) {
    deviceModel = 'Windows PC'
    if (/Windows NT 10/.test(userAgent)) {
      osVersion = 'Windows 10'
    } else if (/Windows NT 11/.test(userAgent)) {
      osVersion = 'Windows 11'
    }
  }
  // Mac Detection
  else if (/Mac/.test(userAgent)) {
    deviceModel = 'Mac'
    osVersion = 'macOS'
  }
  
  // Get device name (can be customized by user)
  const deviceName = localStorage.getItem('device_name') || `${deviceModel} (${deviceType})`
  
  // Get app version from meta tag or package.json
  const appVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content') || '1.0.0'
  
  // Detect biometric type
  let biometricType: string | undefined
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    if (window.innerHeight >= 812) {
      biometricType = 'face_id'
    } else {
      biometricType = 'touch_id'
    }
  } else if (/Android/.test(userAgent)) {
    biometricType = 'fingerprint'
  } else if (/Windows/.test(platform)) {
    biometricType = 'windows_hello'
  } else if (/Mac/.test(platform)) {
    biometricType = 'touch_id'
  }
  
  return {
    deviceId: getDeviceId(),
    deviceName,
    deviceType,
    deviceModel,
    osVersion,
    appVersion,
    userAgent,
    biometricType
  }
}

export function setDeviceName(name: string): void {
  localStorage.setItem('device_name', name)
}

export function clearDeviceData(): void {
  localStorage.removeItem('device_id')
  localStorage.removeItem('device_name')
}

export function isNewDevice(): boolean {
  // Check if this is a new device by looking for existing session data
  const hasSession = localStorage.getItem('worker_session')
  const hasDeviceId = localStorage.getItem('device_id')
  
  return !hasSession || !hasDeviceId
}

export function getDeviceFingerprint(): string {
  // Create a simple device fingerprint for additional security
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language
  const platform = navigator.platform
  
  const fingerprint = `${screen}-${timezone}-${language}-${platform}`
  
  // Hash the fingerprint
  return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}
