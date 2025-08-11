import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  timestamp: number | null
  error: string | null
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watch = false
  } = options

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
    setAccuracy(position.coords.accuracy)
    setError(null)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unknown location error'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timeout'
        break
    }
    
    setError(errorMessage)
    setIsLoading(false)
    console.error('Geolocation error:', errorMessage)
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
    }

    setIsLoading(true)
    setError(null)

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    )

    setWatchId(id)
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError, watchId])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsLoading(false)
    }
  }, [watchId])

  // Auto-start watching if watch option is enabled
  useEffect(() => {
    if (watch) {
      startWatching()
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watch, startWatching])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    location,
    accuracy,
    isLoading,
    error,
    isSupported: 'geolocation' in navigator,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching: watchId !== null
  }
}

// Utility function to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in kilometers
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Utility function to format coordinates for display
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lon).toFixed(6)}°${lonDir}`
}

// Utility function to get address from coordinates (requires reverse geocoding service)
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    // Using OpenStreetMap Nominatim (free service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`
    )
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }
    
    const data = await response.json()
    
    if (data.display_name) {
      return data.display_name
    }
    
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}