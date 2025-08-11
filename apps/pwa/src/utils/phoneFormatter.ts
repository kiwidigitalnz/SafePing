export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '')
  
  // Format based on length
  if (phoneNumber.length === 0) {
    return ''
  } else if (phoneNumber.length <= 3) {
    return phoneNumber
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else if (phoneNumber.length <= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`
  } else {
    return `+${phoneNumber.slice(0, phoneNumber.length - 10)} (${phoneNumber.slice(-10, -7)}) ${phoneNumber.slice(-7, -4)}-${phoneNumber.slice(-4)}`
  }
}

export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidPhoneNumber(value: string): boolean {
  const phoneNumber = unformatPhoneNumber(value)
  return phoneNumber.length >= 10 && phoneNumber.length <= 15
}

export const countryCodesData = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+358', country: 'FI', flag: '🇫🇮' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+48', country: 'PL', flag: '🇵🇱' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+234', country: 'NG', flag: '🇳🇬' },
  { code: '+20', country: 'EG', flag: '🇪🇬' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+62', country: 'ID', flag: '🇮🇩' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+66', country: 'TH', flag: '🇹🇭' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
]

export function detectCountryCode(phoneNumber: string): string {
  const cleaned = unformatPhoneNumber(phoneNumber)
  
  // Sort country codes by length (longest first) to match correctly
  const sortedCodes = [...countryCodesData].sort((a, b) => b.code.length - a.code.length)
  
  for (const country of sortedCodes) {
    const codeDigits = country.code.replace('+', '')
    if (cleaned.startsWith(codeDigits)) {
      return country.code
    }
  }
  
  // Default to US/CA if no match
  return '+1'
}
