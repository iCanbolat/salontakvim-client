/**
 * Phone number utility functions
 */

/**
 * Format Turkish GSM phone number as (5XX) XXX XX XX
 * Input: digits only (e.g., "5055710095")
 * Output: formatted (e.g., "(505) 571 00 95")
 */
export function formatTurkishPhone(digits: string): string {
  if (!digits) return "";

  // Remove any non-digits just in case
  const cleanDigits = digits.replace(/\D/g, "");

  if (cleanDigits.length === 0) return "";
  if (cleanDigits.length <= 3) return `(${cleanDigits}`;
  if (cleanDigits.length <= 6)
    return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3)}`;
  if (cleanDigits.length <= 8)
    return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(
      3,
      6
    )} ${cleanDigits.slice(6)}`;

  return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(
    3,
    6
  )} ${cleanDigits.slice(6, 8)} ${cleanDigits.slice(8, 10)}`;
}

/**
 * Normalize Turkish phone input to digits only
 * Enforces starting with '5' and max 10 digits
 */
export function normalizeTurkishPhoneInput(raw: string): string {
  const digitsOnly = raw.replace(/\D+/g, "");

  // Enforce Turkish GSM pattern: must start with 5, up to 10 digits total
  if (digitsOnly.length === 0) return "";

  return digitsOnly.startsWith("5")
    ? digitsOnly.slice(0, 10)
    : digitsOnly.slice(0, 1);
}
