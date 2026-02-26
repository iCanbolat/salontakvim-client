/**
 * Appointment related utility functions
 */

/**
 * Formats an appointment's public number based on the store's country.
 *
 * @param publicNumber The raw public number from the DB (e.g., "001")
 * @param country The store's country code (e.g., "TR")
 * @returns Formatted string (e.g., "#RV-001" for TR, "#APP-001" for others)
 */
export const formatAppointmentNumber = (
  publicNumber: string | number | undefined,
  country: string = "TR",
): string => {
  if (!publicNumber) return "";

  // Clean potentially existing "RV-" or "APP-" prefixes
  const rawNumber = String(publicNumber).replace(/^(RV-|APP-)/i, "");

  // Ensure we have a 3-digit padded string
  const padded = rawNumber.padStart(3, "0");

  // Prefix based on country
  const prefix = country.toUpperCase() === "TR" ? "RV" : "APP";

  return `#${prefix}-${padded}`;
};

/**
 * Gets the currency symbol for a given currency code.
 *
 * @param currency The currency code (e.g., "TRY", "USD")
 * @returns The currency symbol (e.g., "₺", "$")
 */
export const getCurrencySymbol = (currency: string = "TRY"): string => {
  const commonSymbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const code = currency.toUpperCase();
  return commonSymbols[code] || "₺";
};

/**
 * Formats a number as a currency string.
 *
 * @param amount The amount to format
 * @param currency The currency code (e.g., "TRY", "USD")
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | undefined | null,
  currency: string = "TRY",
): string => {
  if (amount === undefined || amount === null) return "";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
    }).format(numAmount);
  } catch (e) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Number(numAmount).toFixed(2)}`;
  }
};
