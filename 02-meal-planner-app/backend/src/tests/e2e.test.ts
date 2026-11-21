import request from "supertest";
import { createApp } from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

describe("Meal Planner App - End-to-End Cross-Cutting Suite", () => {
  const runId = Date.now();
  let authToken: string;
  let householdId: string;
  let recipeId: string;
  let shoppingListId: string;

  beforeAll(async () => {
    // Seed composition data if not already present
    await prisma.foodComposition.upsert({
      where: { name: "chicken breast" },
      update: {},
      create: { name: "chicken breast", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0 }
    });
    await prisma.foodComposition.upsert({
      where: { name: "quinoa" },
      update: {},
      create: { name: "quinoa", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9, fiberPer100g: 2.8 }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("1. Healthcheck returns 200 with service metadata", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toContain("Meal Planner App");
  });

  test("2. User Registration, Household Genesis & Current Context", async () => {
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `e2e_chef_${runId}@carewell.local`,
        password: "PassSecure2026!",
        name: "E2E Chef Gordon",
        householdName: "Gordon's Gourmet Kitchen"
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();
    authToken = regRes.body.token;
    householdId = regRes.body.household.id;

    // Verify context
    const houseRes = await request(app)
      .get("/api/v1/households/current")
      .set("Authorization", `Bearer ${authToken}`);
    expect(houseRes.status).toBe(200);
    expect(houseRes.body.name).toBe("Gordon's Gourmet Kitchen");
  });

  test("3. Recipe Creation with Scalable and Invariant Non-Scalable Items", async () => {
    const recipeRes = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Herb Crusted Chicken Bowl",
        description: "Nutritious high-protein chicken bowl with quinoa and greens.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        baseServings: 4,
        cuisine: "Mediterranean",
        mealCategory: "DINNER",
        dietaryTags: ["HIGH_PROTEIN", "GLUTEN_FREE"],
        ingredients: [
          { name: "chicken breast", quantity: 600, unit: "g", dimension: "MASS", isScalable: true, aisle: "MEAT_SEAFOOD" },
          { name: "quinoa", quantity: 200, unit: "g", dimension: "MASS", isScalable: true, aisle: "PANTRY_BAKING" },
          { name: "fresh herbs", quantity: 1, unit: "handful", dimension: "OTHER", isScalable: false, notes: "to taste", aisle: "PRODUCE" }
        ],
        steps: [
          { instruction: "Cook quinoa in boiling water.", timerMinutes: 15 },
          { instruction: "Season chicken with herbs and pan sear.", timerMinutes: 12 }
        ]
      });

    expect(recipeRes.status).toBe(201);
    recipeId = recipeRes.body.id;
  });

  test("4. Dynamic Serving Scaling API (Exact Arithmetic)", async () => {
    // Scale up from 4 to 8 servings (2x)
    const scaleRes = await request(app)
      .get(`/api/v1/recipes/${recipeId}?servings=8`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(scaleRes.status).toBe(200);
    expect(scaleRes.body.targetServings).toBe(8);

    const chicken = scaleRes.body.scaledIngredients.find((i: any) => i.name === "chicken breast");
    expect(chicken.quantity).toBe(1200); // 600 * 2

    // Non-scalable herbs should stay 1 handful
    const herbs = scaleRes.body.scaledIngredients.find((i: any) => i.name === "fresh herbs");
    expect(herbs.quantity).toBe(1);
    expect(herbs.scalingFactor).toBe(1.0);
  });

  test("5. Pantry Stock Registration & Expiry Status", async () => {
    // Add pantry item (quinoa in stock: 150g)
    const pantryRes = await request(app)
      .post("/api/v1/pantry")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "quinoa",
        quantity: 150,
        unit: "g",
        dimension: "MASS",
        location: "PANTRY",
        expiryDate: "2027-12-31"
      });
    expect(pantryRes.status).toBe(201);

    // Add another item expiring soon
    await request(app)
      .post("/api/v1/pantry")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "ripe avocado",
        quantity: 2,
        unit: "count",
        dimension: "COUNT",
        location: "REFRIGERATOR",
        expiryDate: "2026-11-23" // Soon
      });

    // Check use_soon filter
    const soonRes = await request(app)
      .get("/api/v1/pantry?filter=use_soon")
      .set("Authorization", `Bearer ${authToken}`);
    expect(soonRes.status).toBe(200);
    expect(soonRes.body.useSoon.some((i: any) => i.name === "ripe avocado")).toBe(true);
  });

  test("6. Weekly Meal Plan Assignment & Smart Shopping List Generation with Pantry Deduction", async () => {
    const weekStart = "2026-11-23";

    // Assign meal to Monday dinner (4 servings)
    const assignRes = await request(app)
      .post("/api/v1/meal-plans/assign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        weekStartDate: weekStart,
        recipeId,
        date: "2026-11-23",
        mealSlot: "DINNER",
        targetServings: 4
      });
    expect(assignRes.status).toBe(201);

    // Generate Shopping List
    const shopRes = await request(app)
      .post("/api/v1/shopping-list/generate")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        weekStartDate: weekStart,
        subtractPantry: true
      });

    expect(shopRes.status).toBe(201);
    shoppingListId = shopRes.body.id;

    // Recipe needs 200g quinoa, pantry has 150g -> Net needed should be 50g!
    const quinoaItem = shopRes.body.items.find((i: any) => i.name.includes("quinoa"));
    expect(quinoaItem).toBeDefined();
    expect(quinoaItem.quantity).toBe(50);
    expect(quinoaItem.pantryDeducted).toBe(150);

    // Chicken breast: needs 600g, 0 in pantry -> 600g
    const chickenItem = shopRes.body.items.find((i: any) => i.name.includes("chicken"));
    expect(chickenItem.quantity).toBe(600);

    // Toggle checked item
    const checkRes = await request(app)
      .patch(`/api/v1/shopping-list/items/${quinoaItem.id}/check`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ checked: true });
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.checked).toBe(true);
  });

  test("7. Nutrition Estimation API & Handling Missing Data Transparently", async () => {
    const nutRes = await request(app)
      .get(`/api/v1/nutrition/recipe/${recipeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(nutRes.status).toBe(200);
    // Chicken and quinoa are known, 'fresh herbs' is missing from composition
    expect(nutRes.body.totalNutrition.status).toBe("INCOMPLETE");
    expect(nutRes.body.totalNutrition.missingIngredients).toContain("fresh herbs");
    expect(nutRes.body.totalNutrition.calories).toBeGreaterThan(0);
    expect(nutRes.body.totalNutrition.disclaimer).toContain("Partial estimate");
  });

  test("8. SSRF Defense: Blocks Internal Requests During Recipe Import", async () => {
    const ssrfRes = await request(app)
      .post("/api/v1/recipes/import")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ url: "http://127.0.0.1:8080/internal/vault" });

    expect(ssrfRes.status).toBe(403);
    expect(ssrfRes.body.error).toContain("SSRF Blocked");
  });
});
