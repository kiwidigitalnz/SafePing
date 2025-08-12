/**
 * Country phone code data
 * Consolidated from multiple implementations across the codebase
 */

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '64', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', dialCode: '353', flag: '🇮🇪' },
  { code: 'DE', name: 'Germany', dialCode: '49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '358', flag: '🇫🇮' },
  { code: 'PT', name: 'Portugal', dialCode: '351', flag: '🇵🇹' },
  { code: 'PL', name: 'Poland', dialCode: '48', flag: '🇵🇱' },
  { code: 'JP', name: 'Japan', dialCode: '81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '54', flag: '🇦🇷' },
  { code: 'ZA', name: 'South Africa', dialCode: '27', flag: '🇿🇦' },
  { code: 'SG', name: 'Singapore', dialCode: '65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '852', flag: '🇭🇰' },
  { code: 'MY', name: 'Malaysia', dialCode: '60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '66', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '62', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', dialCode: '63', flag: '🇵🇭' },
];

/**
 * Get country by dial code
 */
export function getCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Get country by country code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code.toUpperCase());
}

/**
 * Get default country based on browser locale
 */
export function getDefaultCountry(): Country {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const locale = navigator.language.split('-')[1]?.toUpperCase();
    const country = locale ? getCountryByCode(locale) : undefined;
    if (country) return country;
  }
  
  // Default to US
  return COUNTRIES[0];
}