// Contact HH - Phone Number Validation & Formatting Utilities
// Powered by libphonenumber-js

import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Full world countries database — imported from dedicated file (245 countries)
import { COUNTRY_META } from './countriesData.js';
export { COUNTRY_META };

/**
 * Normalizes phone numbers by stripping whitespace, dashes, and brackets.
 */
export function normalizeRawNumber(phone) {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "");
}

/**
 * Attempts to parse a phone number using libphonenumber-js.
 * @param {string} phone 
 * @param {string} defaultCountry 
 */
export function parsePhone(phone, defaultCountry = 'TN') {
  if (!phone) return null;
  
  // Strip spaces for parsing
  const clean = phone.trim();
  
  // Try standard parsing
  let parsed = parsePhoneNumberFromString(clean);
  
  if (!parsed && !clean.startsWith('+')) {
    // Try parsing with default country context
    parsed = parsePhoneNumberFromString(clean, defaultCountry);
  }
  
  return parsed;
}

/**
 * Determines if a phone number is valid.
 */
export function isPhoneValid(phone, defaultCountry = 'TN') {
  const parsed = parsePhone(phone, defaultCountry);
  return parsed ? parsed.isValid() : false;
}

/**
 * Formats a phone number in International style (e.g. +216 22 123 456)
 */
export function formatInternational(phone, defaultCountry = 'TN') {
  const parsed = parsePhone(phone, defaultCountry);
  return parsed ? parsed.formatInternational() : phone;
}

/**
 * Formats a phone number in National style (e.g. 22 123 456)
 */
export function formatNational(phone, defaultCountry = 'TN') {
  const parsed = parsePhone(phone, defaultCountry);
  return parsed ? parsed.formatNational() : phone;
}

/**
 * Extracts country code and meta details.
 */
export function getCountryDetails(phone, defaultCountry = 'TN') {
  const parsed = parsePhone(phone, defaultCountry);
  if (parsed && parsed.country) {
    const meta = COUNTRY_META[parsed.country];
    return {
      iso: parsed.country,
      name: meta ? meta.name : parsed.country,
      flag: meta ? meta.flag : "🏳️",
      prefix: meta ? meta.code : `+${parsed.countryCallingCode}`
    };
  }
  
  // Fallback heuristics if parsing fails
  const clean = normalizeRawNumber(phone);
  if (clean.startsWith('00216') || clean.startsWith('+216')) {
    return { iso: 'TN', name: 'Tunisia', flag: '🇹🇳', prefix: '+216' };
  } else if (clean.startsWith('0033') || clean.startsWith('+33')) {
    return { iso: 'FR', name: 'France', flag: '🇫🇷', prefix: '+33' };
  } else if (clean.startsWith('00213') || clean.startsWith('+213')) {
    return { iso: 'DZ', name: 'Algeria', flag: '🇩🇿', prefix: '+213' };
  }
  
  return { iso: 'UNKNOWN', name: 'Unknown', flag: '🏳️', prefix: '' };
}

/**
 * Scans a number and suggests smart fixes.
 * E.g., adding +216 for Tunisian numbers, stripping leading 0 and adding +33 for French numbers, replacing 00 with +.
 */
export function suggestPhoneCorrection(phone, defaultCountry = 'TN') {
  if (!phone) return null;
  const clean = phone.trim();
  const normalized = normalizeRawNumber(clean);
  
  // Rule 1: Starts with double zero '00', replace with '+'
  if (normalized.startsWith('00')) {
    const fixed = '+' + normalized.substring(2);
    const parsed = parsePhoneNumberFromString(fixed);
    if (parsed && parsed.isValid()) {
      return {
        original: phone,
        fixed: parsed.formatInternational(),
        reason: "Replaced leading '00' with international standard '+'",
        country: getCountryDetails(fixed)
      };
    }
  }

  // Rule 2: Missing prefix, check if matches Tunisian local layout (8 digits starting with 2,4,5,9,3,7)
  if (/^[234579]\d{7}$/.test(normalized)) {
    const fixed = `+216${normalized}`;
    return {
      original: phone,
      fixed: formatInternational(fixed),
      reason: "Detected Tunisian mobile layout (8 digits). Prefixed +216",
      country: COUNTRY_META.TN
    };
  }

  // Rule 3: Missing prefix, French layout (10 digits starting with 06 or 07, or 01-05, 09)
  if (/^0[1-79]\d{8}$/.test(normalized)) {
    // Strip leading 0 and add +33
    const fixed = `+33${normalized.substring(1)}`;
    return {
      original: phone,
      fixed: formatInternational(fixed),
      reason: "Detected French number layout (10 digits starting with 0). Corrected prefix to +33",
      country: COUNTRY_META.FR
    };
  }

  // Rule 4: Algerian layout (10 digits starting with 05, 06, or 07 mobile)
  if (/^0[567]\d{8}$/.test(normalized)) {
    const fixed = `+213${normalized.substring(1)}`;
    return {
      original: phone,
      fixed: formatInternational(fixed),
      reason: "Detected Algerian number layout (10 digits starting with 0). Corrected prefix to +213",
      country: COUNTRY_META.DZ
    };
  }

  // Check if standard validation reveals invalidity
  const parsed = parsePhoneNumberFromString(clean);
  if (parsed && !parsed.isValid()) {
    // Length is wrong
    const expectedLength = parsed.country === 'TN' ? '8 digits' : 'standard country length';
    return {
      original: phone,
      fixed: null,
      reason: `Format mismatch: Number does not match standard length for ${parsed.country || 'selected country'}.`,
      country: getCountryDetails(clean)
    };
  }

  // If parsed with default country successfully but was entered without prefix
  if (!clean.startsWith('+')) {
    const fallbackParsed = parsePhoneNumberFromString(clean, defaultCountry);
    if (fallbackParsed && fallbackParsed.isValid()) {
      return {
        original: phone,
        fixed: fallbackParsed.formatInternational(),
        reason: `Added active default country code (${COUNTRY_META[defaultCountry]?.code || defaultCountry})`,
        country: COUNTRY_META[defaultCountry] || { name: defaultCountry, flag: "🏳️" }
      };
    }
  }

  return null;
}

/**
 * Returns a standardized search string of the phone number.
 */
export function getStandardizedPhone(phone) {
  const clean = normalizeRawNumber(phone);
  // If it doesn't have a plus but has double zeroes, make it a plus
  if (clean.startsWith('00')) {
    return '+' + clean.substring(2);
  }
  // If it's a simple local number, return the digits
  return clean;
}
