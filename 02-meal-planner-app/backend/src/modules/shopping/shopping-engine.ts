/**
 * Carewell Meal Planner App - Intelligent Shopping List Engine
 * 
 * Responsibilities:
 * - Unit dimension conversions within Mass and Volume domains.
 * - Consolidation of identical ingredients across planned recipes.
 * - Incompatible dimension protection (Mass vs Volume without density remains split).
 * - Pantry inventory deduction: max(0, required - pantryAvailable).
 * - Supermarket aisle assignment.
 */

export interface RawShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  dimension: "MASS" | "VOLUME" | "COUNT" | "OTHER";
  aisle?: string;
}

export interface PantryStockItem {
  name: string;
  quantity: number;
  unit: string;
  dimension: "MASS" | "VOLUME" | "COUNT" | "OTHER";
}

export interface ConsolidatedShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  dimension: "MASS" | "VOLUME" | "COUNT" | "OTHER";
  aisle: string;
  pantryDeducted: number;
  notes?: string;
}

// Conversion tables to base unit (grams for Mass, milliliters for Volume)
const MASS_TO_GRAMS: Record<string, number> = {
  g: 1.0,
  gram: 1.0,
  grams: 1.0,
  kg: 1000.0,
  kilogram: 1000.0,
  oz: 28.3495,
  ounce: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1.0,
  milliliter: 1.0,
  l: 1000.0,
  liter: 1000.0,
  tsp: 4.92892,
  teaspoon: 4.92892,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  cup: 236.588,
  cups: 236.588,
  fl_oz: 29.5735
};

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/s$/, ""); // basic singular normalization
}

export function consolidateShoppingList(
  rawItems: RawShoppingItem[],
  pantryStock: PantryStockItem[] = []
): ConsolidatedShoppingItem[] {
  const mergedMap = new Map<string, ConsolidatedShoppingItem>();

  // 1. Group & merge compatible items
  for (const item of rawItems) {
    const normName = normalizeIngredientName(item.name);
    const key = `${normName}__${item.dimension}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        dimension: item.dimension,
        aisle: item.aisle || "PANTRY_BAKING",
        pantryDeducted: 0
      });
    } else {
      const existing = mergedMap.get(key)!;

      // Handle mass aggregation
      if (item.dimension === "MASS" && MASS_TO_GRAMS[item.unit] && MASS_TO_GRAMS[existing.unit]) {
        const totalGrams = (existing.quantity * MASS_TO_GRAMS[existing.unit]) + (item.quantity * MASS_TO_GRAMS[item.unit]);
        existing.quantity = Math.round(totalGrams * 100) / 100;
        existing.unit = "g";
      }
      // Handle volume aggregation
      else if (item.dimension === "VOLUME" && VOLUME_TO_ML[item.unit] && VOLUME_TO_ML[existing.unit]) {
        const totalMl = (existing.quantity * VOLUME_TO_ML[existing.unit]) + (item.quantity * VOLUME_TO_ML[item.unit]);
        existing.quantity = Math.round(totalMl * 100) / 100;
        existing.unit = "ml";
      }
      // Handle count aggregation if same unit
      else if (item.dimension === "COUNT" && item.unit === existing.unit) {
        existing.quantity += item.quantity;
      } else {
        // Incompatible units within same dimension or other
        const subKey = `${key}__${item.unit}`;
        mergedMap.set(subKey, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          dimension: item.dimension,
          aisle: item.aisle || "PANTRY_BAKING",
          pantryDeducted: 0
        });
      }
    }
  }

  // 2. Subtract Pantry Inventory
  const result: ConsolidatedShoppingItem[] = [];

  for (const [key, item] of mergedMap.entries()) {
    const normName = normalizeIngredientName(item.name);
    const matchingPantry = pantryStock.find(
      p => normalizeIngredientName(p.name) === normName && p.dimension === item.dimension
    );

    if (matchingPantry) {
      let pantryQuantityInItemUnit = matchingPantry.quantity;

      // Convert pantry to item unit if mass/volume
      if (item.dimension === "MASS" && MASS_TO_GRAMS[item.unit] && MASS_TO_GRAMS[matchingPantry.unit]) {
        const pantryGrams = matchingPantry.quantity * MASS_TO_GRAMS[matchingPantry.unit];
        pantryQuantityInItemUnit = pantryGrams / MASS_TO_GRAMS[item.unit];
      } else if (item.dimension === "VOLUME" && VOLUME_TO_ML[item.unit] && VOLUME_TO_ML[matchingPantry.unit]) {
        const pantryMl = matchingPantry.quantity * VOLUME_TO_ML[matchingPantry.unit];
        pantryQuantityInItemUnit = pantryMl / VOLUME_TO_ML[item.unit];
      }

      const netNeeded = Math.max(0, Math.round((item.quantity - pantryQuantityInItemUnit) * 100) / 100);
      const deducted = Math.min(item.quantity, Math.round(pantryQuantityInItemUnit * 100) / 100);

      result.push({
        ...item,
        quantity: netNeeded,
        pantryDeducted: deducted,
        notes: deducted > 0 ? `Subtracted ${deducted} ${item.unit} from pantry stock` : undefined
      });
    } else {
      result.push(item);
    }
  }

  return result;
}
