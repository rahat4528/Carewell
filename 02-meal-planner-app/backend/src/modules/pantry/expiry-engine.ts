/**
 * Carewell Meal Planner App - Pantry Expiry & Shelf-Life Engine
 * 
 * Classifies items into:
 * - EXPIRED: expiryDate < currentDate
 * - USE_SOON: expiryDate <= currentDate + thresholdDays
 * - FRESH: expiryDate > currentDate + thresholdDays
 */

export interface PantryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string; // YYYY-MM-DD
}

export interface ExpiryEvaluationResult {
  expiredItems: PantryItemData[];
  useSoonItems: PantryItemData[];
  freshItems: PantryItemData[];
}

export function evaluatePantryExpiry(
  items: PantryItemData[],
  currentDateStr: string,
  thresholdDays: number = 5
): ExpiryEvaluationResult {
  const current = new Date(currentDateStr);
  const threshold = new Date(current);
  threshold.setDate(threshold.getDate() + thresholdDays);
  const thresholdStr = threshold.toISOString().split("T")[0];

  const expired: PantryItemData[] = [];
  const useSoon: PantryItemData[] = [];
  const fresh: PantryItemData[] = [];

  for (const item of items) {
    if (item.expiryDate < currentDateStr) {
      expired.push(item);
    } else if (item.expiryDate <= thresholdStr) {
      useSoon.push(item);
    } else {
      fresh.push(item);
    }
  }

  return {
    expiredItems: expired,
    useSoonItems: useSoon,
    freshItems: fresh
  };
}
