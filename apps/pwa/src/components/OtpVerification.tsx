import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, AlertCircle, ArrowLeft, Phone } from 'lucide-react'
import { formatPhoneForDisplay } from '@safeping/phone-utils'

interface OtpVerificationProps {
  phoneNumber: string
  onVerify: (code: string) => void
  onResend: () => void
  onRetry?: (retryCount?: number) => void
  onCancel?: () => void
  error?: string
  loading?: boolean
  isInvitation?: boolean
}

export function OtpVerification({
  phoneNumber,
  onVerify,
  onResend,
  onRetry,
  onCancel,
  error,
  loading = false,
  isInvitation = false
}: OtpVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Resend timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  useEffect(() => {
    // Clear code on error
    if (error) {
      setCode(['', '', '', '', '', ''])
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }
  }, [error])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    // Check if code is complete
    if (index === 5 && value) {
      const completeCode = newCode.join('')
      if (completeCode.length === 6) {
        onVerify(completeCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move to previous input
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus()
        }
      } else {
        // Clear current input
        handleCodeChange(index, '')
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newCode = digits.split('').concat(Array(6 - digits.length).fill(''))
      setCode(newCode)
      
      // Focus last filled input or next empty one
      const lastIndex = Math.min(digits.length - 1, 5)
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex]?.focus()
      }
      
      // If all digits pasted, submit
      if (digits.length === 6) {
        onVerify(digits)
      }
    }
  }

  const handleResend = () => {
    if (canResend) {
      onResend()
      setResendTimer(60)
      setCanResend(false)
      setCode(['', '', '', '', '', ''])
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
      <div className="w-full max-w-sm">
        {/* Back button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isInvitation ? 'Verify Your Phone' : 'Enter Verification Code'}
        </h2>
        
        {/* Subtitle */}
        <p className="text-sm text-gray-600 text-center mb-2">
          We sent a 6-digit code to
        </p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <Phone className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-medium text-gray-900">
            {formatPhoneForDisplay(phoneNumber)}
          </p>
        </div>

        {/* Code Input */}
        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(e)}
              disabled={loading}
              className={`
                w-12 h-14 text-center text-xl font-semibold
                border-2 rounded-lg transition-all
                ${error 
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
        {error && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
            {/* Retry Button */}
            {onRetry && (
              <button
                onClick={() => onRetry()}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 underline"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Resend Code */}
        <div className="text-center mb-6">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              Resend code
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Resend code in {formatTimer(resendTimer)}
            </p>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Help text */}
        {isInvitation && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              After verification, you'll be prompted to install SafePing and set up your security preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
