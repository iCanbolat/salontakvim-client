/**
 * Formats a customer's public number based on the store's country.
 *
 * @param publicNumber The raw public number from the DB (e.g., "001")
 * @param country The store's country code (e.g., "TR")
 * @returns Formatted string (e.g., "#MÜŞ-001" for TR, "#CUST-001" for others)
 */
export const formatCustomerNumber = (
  publicNumber: string | number | undefined,
  country: string = "TR",
): string => {
  if (!publicNumber) return "";

  // Clean potentially existing "MÜŞ-" or "CUST-" prefixes
  const rawNumber = String(publicNumber).replace(/^(MÜŞ-|CUST-)/i, "");

  // Ensure we have a 3-digit padded string
  const padded = rawNumber.padStart(3, "0");

  // Prefix based on country
  const prefix = country.toUpperCase() === "TR" ? "MÜŞ" : "CUST";

  return `#${prefix}-${padded}`;
};
