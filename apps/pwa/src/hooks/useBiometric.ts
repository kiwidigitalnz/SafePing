import { useState, useEffect, useCallback } from 'react'

interface BiometricCredential {
  id: string
  publicKey: string
  userId: string
  createdAt: Date
}

export function useBiometric() {
  const [isSupported, setIsSupported] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [biometricType, setBiometricType] = useState<string>('none')

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = async () => {
    // Check for WebAuthn support
    if (window.PublicKeyCredential) {
      setIsSupported(true)
      
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      setIsAvailable(available)
      
      // Detect biometric type based on device
      detectBiometricType()
      
      // Check if user has registered credentials
      checkRegisteredCredentials()
    }
  }

  const detectBiometricType = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()
    
    // iOS devices
    if (/iphone|ipad|ipod/.test(userAgent)) {
      if (window.innerHeight >= 812) {
        // iPhone X and later have Face ID
        setBiometricType('face_id')
      } else {
        setBiometricType('touch_id')
      }
    }
    // Android devices
    else if (/android/.test(userAgent)) {
      // Most modern Android devices have fingerprint
      setBiometricType('fingerprint')
    }
    // Windows Hello
    else if (/windows/.test(platform)) {
      setBiometricType('windows_hello')
    }
    // macOS
    else if (/mac/.test(platform)) {
      setBiometricType('touch_id')
    }
    else {
      setBiometricType('biometric')
    }
  }

  const checkRegisteredCredentials = () => {
    const credentials = localStorage.getItem('biometric_credentials')
    setIsRegistered(!!credentials)
  }

  const registerBiometric = async (userId: string, challenge?: Uint8Array): Promise<boolean> => {
    if (!isAvailable) {
      console.error('Biometric authentication not available')
      return false
    }

    try {
      // Generate challenge if not provided
      const authChallenge = challenge || crypto.getRandomValues(new Uint8Array(32))
      
      // Create credential options
      const createCredentialOptions: PublicKeyCredentialCreationOptions = {
        challenge: authChallenge,
        rp: {
          name: 'SafePing',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'SafePing User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: createCredentialOptions,
      }) as PublicKeyCredential

      if (!credential) {
        return false
      }

      // Store credential info
      const credentialInfo: BiometricCredential = {
        id: credential.id,
        publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        userId: userId,
        createdAt: new Date(),
      }

      // Save to localStorage (in production, this should be sent to server)
      localStorage.setItem('biometric_credentials', JSON.stringify(credentialInfo))
      localStorage.setItem('biometric_enabled', 'true')
      
      setIsRegistered(true)
      
      return true
    } catch (error) {
      console.error('Error registering biometric:', error)
      return false
    }
  }

  const authenticateWithBiometric = async (challenge?: Uint8Array): Promise<boolean> => {
    if (!isAvailable || !isRegistered) {
      console.error('Biometric authentication not available or not registered')
      return false
    }

    try {
      // Get stored credential
      const storedCredential = localStorage.getItem('biometric_credentials')
      if (!storedCredential) {
        return false
      }

      const credentialInfo: BiometricCredential = JSON.parse(storedCredential)
      
      // Generate challenge if not provided
      const authChallenge = challenge || crypto.getRandomValues(new Uint8Array(32))
      
      // Create assertion options
      const getCredentialOptions: PublicKeyCredentialRequestOptions = {
        challenge: authChallenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialInfo.publicKey), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      }

      // Request authentication
      const assertion = await navigator.credentials.get({
        publicKey: getCredentialOptions,
      }) as PublicKeyCredential

      if (!assertion) {
        return false
      }

      // In production, send assertion to server for verification
      // For now, we'll just check if we got a valid response
      const response = assertion.response as AuthenticatorAssertionResponse
      
      // Store last authentication time
      localStorage.setItem('last_biometric_auth', new Date().toISOString())
      
      return true
    } catch (error) {
      console.error('Error authenticating with biometric:', error)
      return false
    }
  }

  const removeBiometric = () => {
    localStorage.removeItem('biometric_credentials')
    localStorage.removeItem('biometric_enabled')
    localStorage.removeItem('last_biometric_auth')
    setIsRegistered(false)
  }

  const isBiometricEnabled = (): boolean => {
    return localStorage.getItem('biometric_enabled') === 'true'
  }

  return {
    isSupported,
    isAvailable,
    isRegistered,
    biometricType,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
    isBiometricEnabled,
    checkBiometricSupport,
  }
}
