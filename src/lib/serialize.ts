/**
 * Serialize Prisma objects for client components
 * Converts Decimal to number and Date to string
 */

import type { Prisma } from "@prisma/client";

/**
 * Serialize a Connection object for client components
 */
export function serializeConnection<T extends { totalSpent?: unknown }>(
  connection: T
): T & { totalSpent: number | null } {
  return {
    ...connection,
    totalSpent:
      connection.totalSpent && typeof connection.totalSpent === "object"
        ? Number(connection.totalSpent)
        : null,
  };
}

/**
 * Serialize an array of Connection objects
 */
export function serializeConnections<T extends { totalSpent?: unknown }>(
  connections: T[]
): Array<T & { totalSpent: number | null }> {
  return connections.map(serializeConnection);
}

/**
 * Serialize a JobRequest object for client components
 */
export function serializeJobRequest<
  T extends {
    budgetMin?: unknown;
    budgetMax?: unknown;
    quote?: { totalAmount?: unknown } | null;
  }
>(jobRequest: T) {
  return {
    ...jobRequest,
    budgetMin:
      jobRequest.budgetMin && typeof jobRequest.budgetMin === "object"
        ? Number(jobRequest.budgetMin)
        : jobRequest.budgetMin,
    budgetMax:
      jobRequest.budgetMax && typeof jobRequest.budgetMax === "object"
        ? Number(jobRequest.budgetMax)
        : jobRequest.budgetMax,
    quote: jobRequest.quote
      ? {
          ...jobRequest.quote,
          totalAmount:
            jobRequest.quote.totalAmount &&
            typeof jobRequest.quote.totalAmount === "object"
              ? Number(jobRequest.quote.totalAmount)
              : jobRequest.quote.totalAmount,
        }
      : null,
  };
}

/**
 * Serialize an array of JobRequest objects
 */
export function serializeJobRequests<
  T extends {
    budgetMin?: unknown;
    budgetMax?: unknown;
    quote?: { totalAmount?: unknown } | null;
  }
>(jobRequests: T[]) {
  return jobRequests.map(serializeJobRequest);
}

/**
 * Serialize a Quote object for client components
 */
export function serializeQuote<
  T extends {
    totalAmount?: unknown;
    items?: Array<{ unitPrice?: unknown; total?: unknown; qty?: unknown }>;
  }
>(quote: T) {
  return {
    ...quote,
    totalAmount:
      quote.totalAmount && typeof quote.totalAmount === "object"
        ? Number(quote.totalAmount)
        : quote.totalAmount,
    items: quote.items?.map((item) => ({
      ...item,
      qty:
        item.qty && typeof item.qty === "object" ? Number(item.qty) : item.qty,
      unitPrice:
        item.unitPrice && typeof item.unitPrice === "object"
          ? Number(item.unitPrice)
          : item.unitPrice,
      total:
        item.total && typeof item.total === "object"
          ? Number(item.total)
          : item.total,
    })),
  };
}

/**
 * Serialize a WorkRecord object for client components
 */
export function serializeWorkRecord<T extends { cost?: unknown }>(
  workRecord: T
) {
  return {
    ...workRecord,
    cost:
      workRecord.cost && typeof workRecord.cost === "object"
        ? Number(workRecord.cost)
        : workRecord.cost,
  };
}

/**
 * Generic serializer for any object with Decimal fields
 */
export function serializeDecimals<T extends Record<string, unknown>>(
  obj: T
): T {
  const serialized = { ...obj };

  for (const key in serialized) {
    const value = serialized[key];

    // Handle Decimal objects
    if (value && typeof value === "object" && "toNumber" in value) {
      (serialized[key] as number) = Number(value);
    }
    // Recursively handle nested objects
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      serialized[key] = serializeDecimals(value as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? serializeDecimals(item as Record<string, unknown>)
          : item
      ) as T[Extract<keyof T, string>];
    }
  }

  return serialized;
}