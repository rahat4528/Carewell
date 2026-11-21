import { evaluatePantryExpiry, PantryItemData } from "../modules/pantry/expiry-engine";

describe("Pantry Expiry & Shelf-Life Engine", () => {
  const currentDate = "2026-11-21";

  const pantryItems: PantryItemData[] = [
    { id: "1", name: "Expired Milk", quantity: 1, unit: "l", location: "REFRIGERATOR", expiryDate: "2026-11-19" },
    { id: "2", name: "Greek Yogurt (Expires Tomorrow)", quantity: 450, unit: "g", location: "REFRIGERATOR", expiryDate: "2026-11-22" },
    { id: "3", name: "Fresh Spinach (Expires in 4 days)", quantity: 200, unit: "g", location: "REFRIGERATOR", expiryDate: "2026-11-25" },
    { id: "4", name: "Long Shelf Quinoa", quantity: 1000, unit: "g", location: "PANTRY", expiryDate: "2027-08-15" }
  ];

  test("correctly categorizes expired items", () => {
    const result = evaluatePantryExpiry(pantryItems, currentDate, 5);
    expect(result.expiredItems).toHaveLength(1);
    expect(result.expiredItems[0].name).toBe("Expired Milk");
  });

  test("identifies items expiring within threshold window (5 days) as 'USE_SOON'", () => {
    const result = evaluatePantryExpiry(pantryItems, currentDate, 5);
    expect(result.useSoonItems).toHaveLength(2);
    expect(result.useSoonItems.map(i => i.name)).toEqual([
      "Greek Yogurt (Expires Tomorrow)",
      "Fresh Spinach (Expires in 4 days)"
    ]);
  });

  test("retains fresh items with ample shelf-life", () => {
    const result = evaluatePantryExpiry(pantryItems, currentDate, 5);
    expect(result.freshItems).toHaveLength(1);
    expect(result.freshItems[0].name).toBe("Long Shelf Quinoa");
  });
});
