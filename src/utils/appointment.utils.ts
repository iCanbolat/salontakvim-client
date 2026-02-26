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
