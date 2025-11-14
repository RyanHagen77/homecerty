// lib/address-verification.ts

/**
 * Address verification using Smarty API (USPS data)
 * Free tier: 250 lookups/month
 * Docs: https://www.smarty.com/docs/cloud/us-street-api
 */

export type VerifiedAddress = {
  isValid: boolean;
  original: string;
  verified?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    zip4?: string;
    deliverable: boolean;
  };
  suggestions?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  }[];
  error?: string;
};

/**
 * Verify address using Smarty API
 */
export async function verifyAddress(
  street: string,
  city: string,
  state: string,
  zip: string,
  unit?: string
): Promise<VerifiedAddress> {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;

  console.log("🔑 Smarty credentials check:", {
    hasAuthId: !!authId,
    hasAuthToken: !!authToken,
    authIdLength: authId?.length,
    authTokenLength: authToken?.length,
  });

  if (!authId || !authToken) {
    console.warn("Smarty credentials not configured - skipping verification");
    return {
      isValid: true, // Allow through if not configured
      original: `${street}${unit ? ` ${unit}` : ""}, ${city}, ${state} ${zip}`,
    };
  }

  try {
    const params = new URLSearchParams({
      "auth-id": authId,
      "auth-token": authToken,
      street: unit ? `${street} ${unit}` : street,
      city,
      state,
      zipcode: zip,
      match: "invalid", // Only return valid addresses
    });

    const url = `https://us-street.api.smarty.com/street-address?${params}`;
    console.log("🌐 Calling Smarty API:", url.replace(authToken, "***"));

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Smarty response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Smarty API error:", response.status, errorText);
      throw new Error(`Smarty API error: ${response.status}`);
    }

    const results = await response.json();

    // No results means invalid address
    if (!results || results.length === 0) {
      return {
        isValid: false,
        original: `${street}${unit ? ` ${unit}` : ""}, ${city}, ${state} ${zip}`,
        error: "Address not found in USPS database",
      };
    }

    // Get first result (most likely match)
    const match = results[0];
    const components = match.components;
    const metadata = match.metadata;

    // Build clean street address (primary line without unit)
    let cleanStreet = components.primary_number
      ? `${components.primary_number} ${components.street_predirection || ""} ${components.street_name} ${components.street_suffix || ""}`.trim()
      : match.delivery_line_1;

    // Clean up extra spaces
    cleanStreet = cleanStreet.replace(/\s+/g, " ").trim();

    return {
      isValid: true,
      original: `${street}${unit ? ` ${unit}` : ""}, ${city}, ${state} ${zip}`,
      verified: {
        street: cleanStreet,
        unit: components.secondary_number
          ? `${components.secondary_designator || ""} ${components.secondary_number}`.trim()
          : undefined,
        city: components.city_name,
        state: components.state_abbreviation,
        zip: components.zipcode,
        zip4: components.plus4_code,
        deliverable: metadata.rdi === "Residential" || metadata.rdi === "Commercial",
      },
    };
  } catch (error) {
    console.error("Address verification error:", error);
    return {
      isValid: false,
      original: `${street}${unit ? ` ${unit}` : ""}, ${city}, ${state} ${zip}`,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Autocomplete address suggestions (for frontend)
 */
export async function getAddressSuggestions(
  partial: string
): Promise<{ suggestions: string[] }> {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;

  if (!authId || !authToken) {
    return { suggestions: [] };
  }

  try {
    const params = new URLSearchParams({
      "auth-id": authId,
      "auth-token": authToken,
      prefix: partial,
    });

    const response = await fetch(
      `https://us-autocomplete-pro.api.smarty.com/lookup?${params}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`Smarty autocomplete error: ${response.status}`);
    }

    const data = await response.json();
    return {
      suggestions: data.suggestions?.map((s: any) => s.street_line) || [],
    };
  } catch (error) {
    console.error("Autocomplete error:", error);
    return { suggestions: [] };
  }
}

/**
 * Parse and normalize address for matching
 */
export function normalizeAddressForMatching(
  street: string,
  city: string,
  state: string,
  zip: string
): string {
  // Remove unit numbers, special chars, lowercase
  const normalized = `${street}${city}${state}${zip}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return normalized;
}