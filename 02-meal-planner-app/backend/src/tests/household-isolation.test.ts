import request from "supertest";
import { createApp } from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

describe("Meal Planner App - Cross-Household Security & Isolation Suite", () => {
  let tokenA: string;
  let householdAId: string;
  let tokenB: string;
  let householdBId: string;
  let recipeAId: string;
  let pantryAId: string;

  const runId = Date.now();

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `alice_chef_${runId}@carewell.local`,
        password: "SecureChefPass123!",
        name: "Alice Chef",
        householdName: "Alice Household"
      });
    tokenA = resA.body.token;
    householdAId = resA.body.household.id;

    // Register User B
    const resB = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `bob_cook_${runId}@carewell.local`,
        password: "SecureChefPass123!",
        name: "Bob Cook",
        householdName: "Bob Household"
      });
    tokenB = resB.body.token;
    householdBId = resB.body.household.id;

    // Create Recipe in Household A
    const recRes = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Alice Private Lasagna",
        baseServings: 6,
        ingredients: [{ name: "pasta sheets", quantity: 300, unit: "g", dimension: "MASS" }],
        steps: ["Layer pasta and sauce.", "Bake 40 mins."]
      });
    recipeAId = recRes.body.id;

    // Create Pantry Item in Household A
    const pRes = await request(app)
      .post("/api/v1/pantry")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Alice Secret Truffle Oil",
        quantity: 100,
        unit: "ml",
        dimension: "VOLUME",
        expiryDate: "2027-01-01"
      });
    pantryAId = pRes.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("User B CANNOT view User A's private household recipes", async () => {
    // 1. Direct fetch by ID
    const getRes = await request(app)
      .get(`/api/v1/recipes/${recipeAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    // 2. Listing recipes should not leak Household A's recipe
    const listRes = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(listRes.body.some((r: any) => r.id === recipeAId)).toBe(false);
  });

  test("User B CANNOT delete or mutate User A's pantry inventory", async () => {
    const delRes = await request(app)
      .delete(`/api/v1/pantry/${pantryAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(delRes.status).toBe(404);

    // Ensure item still exists for User A
    const checkA = await request(app)
      .get("/api/v1/pantry")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(checkA.body.allItems.some((i: any) => i.id === pantryAId)).toBe(true);
  });

  test("User B CANNOT assign User A's recipe to User B's meal plan", async () => {
    const assignRes = await request(app)
      .post("/api/v1/meal-plans/assign")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        weekStartDate: "2026-11-23",
        recipeId: recipeAId,
        date: "2026-11-23",
        mealSlot: "DINNER"
      });
    expect(assignRes.status).toBe(404);
  });
});
