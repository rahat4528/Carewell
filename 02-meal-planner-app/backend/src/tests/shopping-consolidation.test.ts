import {
  consolidateShoppingList,
  RawShoppingItem,
  PantryStockItem
} from "../modules/shopping/shopping-engine";

describe("Intelligent Shopping List Consolidation Engine", () => {
  test("merges mass ingredients across compatible units into base grams (g + kg)", () => {
    const rawItems: RawShoppingItem[] = [
      { name: "chicken breast", quantity: 300, unit: "g", dimension: "MASS", aisle: "MEAT_SEAFOOD" },
      { name: "chicken breasts", quantity: 0.5, unit: "kg", dimension: "MASS", aisle: "MEAT_SEAFOOD" } // 500g
    ];

    const consolidated = consolidateShoppingList(rawItems);
    expect(consolidated.length).toBe(1);
    expect(consolidated[0].name).toContain("chicken breast");
    expect(consolidated[0].quantity).toBe(800); // 300g + 500g
    expect(consolidated[0].unit).toBe("g");
  });

  test("merges volume ingredients across compatible units into base milliliters (tbsp + ml)", () => {
    const rawItems: RawShoppingItem[] = [
      { name: "olive oil", quantity: 15, unit: "ml", dimension: "VOLUME", aisle: "PANTRY_BAKING" },
      { name: "olive oil", quantity: 1, unit: "tbsp", dimension: "VOLUME", aisle: "PANTRY_BAKING" } // 14.79 ml
    ];

    const consolidated = consolidateShoppingList(rawItems);
    expect(consolidated.length).toBe(1);
    expect(consolidated[0].quantity).toBe(29.79);
    expect(consolidated[0].unit).toBe("ml");
  });

  test("refuses to merge incompatible dimensions (Mass vs Volume) without density, keeping distinct rows", () => {
    const rawItems: RawShoppingItem[] = [
      { name: "flour", quantity: 250, unit: "g", dimension: "MASS", aisle: "PANTRY_BAKING" },
      { name: "flour", quantity: 1, unit: "cup", dimension: "VOLUME", aisle: "PANTRY_BAKING" }
    ];

    const consolidated = consolidateShoppingList(rawItems);
    // Must remain 2 separate lines to prevent guessing density
    expect(consolidated.length).toBe(2);
    expect(consolidated.some(c => c.unit === "g" && c.quantity === 250)).toBe(true);
    expect(consolidated.some(c => c.unit === "cup" && c.quantity === 1)).toBe(true);
  });

  test("subtracts available pantry stock from required grocery quantities accurately", () => {
    const rawItems: RawShoppingItem[] = [
      { name: "quinoa", quantity: 400, unit: "g", dimension: "MASS", aisle: "PANTRY_BAKING" },
      { name: "black beans", quantity: 3, unit: "can", dimension: "COUNT", aisle: "PANTRY_BAKING" }
    ];

    const pantryStock: PantryStockItem[] = [
      { name: "quinoa", quantity: 150, unit: "g", dimension: "MASS" }, // 400 - 150 = 250g needed
      { name: "black beans", quantity: 4, unit: "can", dimension: "COUNT" } // 3 - 4 = 0 needed (fully stocked)
    ];

    const consolidated = consolidateShoppingList(rawItems, pantryStock);

    const quinoa = consolidated.find(c => c.name === "quinoa");
    expect(quinoa?.quantity).toBe(250);
    expect(quinoa?.pantryDeducted).toBe(150);

    const beans = consolidated.find(c => c.name === "black beans");
    expect(beans?.quantity).toBe(0);
    expect(beans?.pantryDeducted).toBe(3);
  });
});
