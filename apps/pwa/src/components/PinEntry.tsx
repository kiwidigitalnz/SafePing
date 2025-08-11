import React, { useState, useRef, useEffect } from 'react'
import { Shield, AlertCircle, Lock } from 'lucide-react'

interface PinEntryProps {
  onSubmit: (pin: string) => void
  onCancel?: () => void
  title?: string
  subtitle?: string
  error?: string
  attemptsRemaining?: number
  isSetup?: boolean
  loading?: boolean
}

export function PinEntry({
  onSubmit,
  onCancel,
  title = 'Enter PIN',
  subtitle,
  error,
  attemptsRemaining,
  isSetup = false,
  loading = false
}: PinEntryProps) {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [isConfirming, setIsConfirming] = useState(false)
  const [setupError, setSetupError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Clear error when user starts typing
    if (error) {
      setPin(['', '', '', '', '', ''])
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }
  }, [error])

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    const newPin = isConfirm ? [...confirmPin] : [...pin]
    newPin[index] = value

    if (isConfirm) {
      setConfirmPin(newPin)
    } else {
      setPin(newPin)
    }

    // Auto-focus next input
    if (value && index < 5) {
      const refs = isConfirm ? confirmRefs : inputRefs
      if (refs.current[index + 1]) {
        refs.current[index + 1]?.focus()
      }
    }

    // Check if PIN is complete
    if (index === 5 && value) {
      const completePin = newPin.join('')
      if (completePin.length === 6) {
        if (isSetup && !isConfirm) {
          // Move to confirmation
          setIsConfirming(true)
          setTimeout(() => {
            if (confirmRefs.current[0]) {
              confirmRefs.current[0].focus()
            }
          }, 100)
        } else if (isSetup && isConfirm) {
          // Check if PINs match
          const firstPin = pin.join('')
          if (firstPin === completePin) {
            onSubmit(completePin)
          } else {
            setSetupError('PINs do not match')
            setConfirmPin(['', '', '', '', '', ''])
            setIsConfirming(false)
            setPin(['', '', '', '', '', ''])
            setTimeout(() => {
              if (inputRefs.current[0]) {
                inputRefs.current[0].focus()
              }
            }, 100)
          }
        } else {
          // Regular PIN entry
          onSubmit(completePin)
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin
      const refs = isConfirm ? confirmRefs : inputRefs
      
      if (!currentPin[index] && index > 0) {
        // Move to previous input
        if (refs.current[index - 1]) {
          refs.current[index - 1]?.focus()
        }
      } else {
        // Clear current input
        handlePinChange(index, '', isConfirm)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent, isConfirm: boolean = false) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newPin = digits.split('').concat(Array(6 - digits.length).fill(''))
      if (isConfirm) {
        setConfirmPin(newPin)
      } else {
        setPin(newPin)
      }
      
      // Focus last filled input or next empty one
      const refs = isConfirm ? confirmRefs : inputRefs
      const lastIndex = Math.min(digits.length - 1, 5)
      if (refs.current[lastIndex]) {
        refs.current[lastIndex]?.focus()
      }
      
      // If all digits pasted, submit
      if (digits.length === 6) {
        if (isSetup && !isConfirm) {
          setIsConfirming(true)
          setTimeout(() => {
            if (confirmRefs.current[0]) {
              confirmRefs.current[0].focus()
            }
          }, 100)
        } else if (isSetup && isConfirm) {
          const firstPin = pin.join('')
          if (firstPin === digits) {
            onSubmit(digits)
          } else {
            setSetupError('PINs do not match')
            setConfirmPin(['', '', '', '', '', ''])
            setIsConfirming(false)
            setPin(['', '', '', '', '', ''])
          }
        } else {
          onSubmit(digits)
        }
      }
    }
  }

  const currentPin = isConfirming ? confirmPin : pin
  const currentRefs = isConfirming ? confirmRefs : inputRefs
  const displayError = setupError || error

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isSetup ? <Shield className="w-8 h-8 text-blue-600" /> : <Lock className="w-8 h-8 text-blue-600" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isConfirming ? 'Confirm PIN' : title}
        </h2>
        
        {/* Subtitle */}
        {(subtitle || isSetup) && (
          <p className="text-sm text-gray-600 text-center mb-8">
            {isConfirming 
              ? 'Please re-enter your PIN to confirm'
              : isSetup 
              ? 'Create a 6-digit PIN for quick access'
              : subtitle}
          </p>
        )}

        {/* PIN Input */}
        <div className="flex justify-center gap-2 mb-6">
          {currentPin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                currentRefs.current[index] = el
              }}
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value, isConfirming)}
              onKeyDown={(e) => handleKeyDown(index, e, isConfirming)}
              onPaste={(e) => handlePaste(e, isConfirming)}
              disabled={loading}
              className={`
                w-12 h-14 text-center text-xl font-semibold
                border-2 rounded-lg transition-all
                ${displayError 
                  ? 'border-red-300 bg-red-50' 
                  : digit 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="flex items-center justify-center gap-2 mb-4 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{displayError}</p>
          </div>
        )}

        {/* Attempts Remaining */}
        {attemptsRemaining !== undefined && attemptsRemaining < 5 && (
          <p className="text-sm text-center text-orange-600 mb-4">
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Use different auth method */}
          {!isSetup && onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Use different authentication method
            </button>
          )}

          {/* Cancel button for setup */}
          {isSetup && onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}
