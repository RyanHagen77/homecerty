// lib/address-utils.ts

/**
 * Normalize an address for reliable matching across different input formats
 *
 * Example:
 * Input:  "123 Main St.", "Springfield", "IL", "62701-1234"
 * Output: "123mainstspringfieldil62701"
 *
 * This allows matching addresses even when:
 * - Capitalization differs
 * - Punctuation differs
 * - ZIP+4 vs ZIP-5
 * - Street abbreviations (St vs Street) - requires manual handling
 */
export function normalizeAddress(address: {
  line1: string;
  city: string;
  state: string;
  zip: string;
}): string {
  // Remove all non-alphanumeric characters, convert to lowercase
  const line1 = address.line1.toLowerCase().replace(/[^\w]/g, "");
  const city = address.city.toLowerCase().replace(/[^\w]/g, "");
  const state = address.state.toLowerCase();
  const zip = address.zip.replace(/[^\d]/g, "").slice(0, 5); // First 5 digits only

  return `${line1}${city}${state}${zip}`;
}

/**
 * Check if two addresses match (case-insensitive, punctuation-insensitive)
 */
export function addressesMatch(
  address1: { line1: string; city: string; state: string; zip: string },
  address2: { line1: string; city: string; state: string; zip: string }
): boolean {
  return normalizeAddress(address1) === normalizeAddress(address2);
}

/**
 * Format an address for display
 */
export function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
}): string {
  const parts = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zip}`,
  ].filter(Boolean);

  return parts.join(", ");
}