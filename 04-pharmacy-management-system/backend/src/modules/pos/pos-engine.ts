export interface CartItem {
  medicationId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  isTaxable: boolean;
}

export interface PosReceipt {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  itemCount: number;
  items: Array<CartItem & { lineTotalCents: number }>;
}

export interface TenderBreakdown {
  cashCents?: number;
  cardCents?: number;
  insuranceCents?: number;
}

export const DEFAULT_TAX_RATE_BPS = 825; // 8.25% expressed as basis points (1 bp = 0.01%)

export function calculatePosTotals(
  items: CartItem[],
  taxRateBps = DEFAULT_TAX_RATE_BPS
): PosReceipt {
  if (!items || items.length === 0) {
    throw new Error('Cart cannot be empty.');
  }

  let subtotalCents = 0;
  let taxableSubtotalCents = 0;
  const processedItems = [];

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error(`Quantity for ${item.name} must be positive.`);
    }
    const lineTotalCents = item.quantity * item.unitPriceCents;
    subtotalCents += lineTotalCents;

    if (item.isTaxable) {
      taxableSubtotalCents += lineTotalCents;
    }

    processedItems.push({
      ...item,
      lineTotalCents
    });
  }

  // Exact integer math: round to nearest cent
  const taxCents = Math.round((taxableSubtotalCents * taxRateBps) / 10000);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents,
    itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
    items: processedItems
  };
}

export function validateTender(
  totalCents: number,
  tender: TenderBreakdown
): { valid: boolean; tenderTotalCents: number; changeDueCents: number; discrepancyCents: number } {
  const cash = tender.cashCents || 0;
  const card = tender.cardCents || 0;
  const insurance = tender.insuranceCents || 0;
  const tenderTotal = cash + card + insurance;

  if (tenderTotal < totalCents) {
    return {
      valid: false,
      tenderTotalCents: tenderTotal,
      changeDueCents: 0,
      discrepancyCents: totalCents - tenderTotal
    };
  }

  // Change is only given on cash transactions where total exceeds totalCents
  const changeDueCents = Math.max(0, tenderTotal - totalCents);

  return {
    valid: true,
    tenderTotalCents: tenderTotal,
    changeDueCents,
    discrepancyCents: 0
  };
}
