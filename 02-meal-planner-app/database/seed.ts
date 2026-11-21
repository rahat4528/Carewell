import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const COMPOSITION_DATA = [
  { name: "chicken breast", caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0.0, fatPer100g: 3.6, fiberPer100g: 0.0 },
  { name: "salmon", caloriesPer100g: 208, proteinPer100g: 20.0, carbsPer100g: 0.0, fatPer100g: 13.0, fiberPer100g: 0.0 },
  { name: "quinoa", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9, fiberPer100g: 2.8 },
  { name: "brown rice", caloriesPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 23.5, fatPer100g: 0.9, fiberPer100g: 1.8 },
  { name: "broccoli", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7.0, fatPer100g: 0.4, fiberPer100g: 2.6 },
  { name: "olive oil", caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, fiberPer100g: 0.0 },
  { name: "rolled oats", caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9, fiberPer100g: 10.6 },
  { name: "eggs", caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.7, fatPer100g: 9.5, fiberPer100g: 0.0 },
  { name: "black beans", caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 23.7, fatPer100g: 0.5, fiberPer100g: 8.7 },
  { name: "greek yogurt", caloriesPer100g: 59, proteinPer100g: 10.0, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 0.0 },
  { name: "spinach", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2 },
  { name: "sweet potato", caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20.1, fatPer100g: 0.1, fiberPer100g: 3.0 }
];

export const INITIAL_SUBSTITUTIONS = [
  { originalIngredient: "sour cream", substituteIngredient: "plain greek yogurt", ratio: 1.0, notes: "Direct 1:1 substitute; higher protein, lower fat." },
  { originalIngredient: "butter", substituteIngredient: "extra virgin olive oil", ratio: 0.75, notes: "Use 3/4 amount of olive oil for liquid baking/sauteing." },
  { originalIngredient: "cow milk", substituteIngredient: "unsweetened almond milk", ratio: 1.0, notes: "1:1 dairy-free alternative." }
];

export async function seedMealPlannerDatabase() {
  console.log("🌱 Seeding Carewell Meal Planner App database...");

  // 1. Seed Composition Data
  for (const item of COMPOSITION_DATA) {
    await prisma.foodComposition.upsert({
      where: { name: item.name },
      update: item,
      create: item
    });
  }
  console.log(`✓ Seeded ${COMPOSITION_DATA.length} verified food composition records.`);

  // 2. Seed Substitution Rules
  for (const sub of INITIAL_SUBSTITUTIONS) {
    const existing = await prisma.substitutionRule.findFirst({
      where: { originalIngredient: sub.originalIngredient }
    });
    if (!existing) {
      await prisma.substitutionRule.create({ data: sub });
    }
  }

  // 3. Seed Demo User & Household
  const demoEmail = "chef@carewell.local";
  let user = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!user) {
    const passwordHash = await bcrypt.hash("CarewellDemo2026!", 10);
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: "Chef Maya Lin",
        role: "USER"
      }
    });

    const household = await prisma.household.create({
      data: {
        name: "Maya's Kitchen",
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      }
    });

    // 4. Seed Recipes
    const recipe1 = await prisma.recipe.create({
      data: {
        householdId: household.id,
        title: "Mediterranean Lemon Herb Chicken Bowl",
        description: "Juicy marinated chicken breast with fluffy quinoa, crisp cucumber, and light olive oil vinaigrette.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        totalTimeMinutes: 35,
        baseServings: 4,
        cuisine: "Mediterranean",
        mealCategory: "DINNER",
        dietaryTags: JSON.stringify(["HIGH_PROTEIN", "GLUTEN_FREE"]),
        ingredients: {
          create: [
            { name: "chicken breast", quantity: 600, unit: "g", dimension: "MASS", isScalable: true, aisle: "MEAT_SEAFOOD" },
            { name: "quinoa", quantity: 200, unit: "g", dimension: "MASS", isScalable: true, aisle: "PANTRY_BAKING" },
            { name: "olive oil", quantity: 30, unit: "ml", dimension: "VOLUME", isScalable: true, aisle: "PANTRY_BAKING" },
            { name: "spinach", quantity: 150, unit: "g", dimension: "MASS", isScalable: true, aisle: "PRODUCE" },
            { name: "salt to taste", quantity: 1, unit: "pinch", dimension: "OTHER", isScalable: false, notes: "Season to preference", aisle: "SPICES" }
          ]
        },
        cookingSteps: {
          create: [
            { stepNumber: 1, instruction: "Rinse quinoa thoroughly and cook in 400ml water for 15 minutes.", timerMinutes: 15 },
            { stepNumber: 2, instruction: "Season chicken breast with lemon zest, dried oregano, and olive oil.", timerMinutes: 5 },
            { stepNumber: 3, instruction: "Pan sear chicken breast for 6-7 minutes per side until cooked through.", timerMinutes: 14 },
            { stepNumber: 4, instruction: "Assemble bowls with quinoa, sliced chicken, and fresh spinach." }
          ]
        }
      }
    });

    // 5. Seed Pantry Items
    await prisma.pantryItem.createMany({
      data: [
        { householdId: household.id, name: "quinoa", quantity: 500, unit: "g", dimension: "MASS", location: "PANTRY", expiryDate: "2027-06-30" },
        { householdId: household.id, name: "olive oil", quantity: 500, unit: "ml", dimension: "VOLUME", location: "PANTRY", expiryDate: "2027-12-31" },
        { householdId: household.id, name: "greek yogurt", quantity: 450, unit: "g", dimension: "MASS", location: "REFRIGERATOR", expiryDate: "2026-11-23" }, // Use Soon
        { householdId: household.id, name: "spinach", quantity: 100, unit: "g", dimension: "MASS", location: "REFRIGERATOR", expiryDate: "2026-11-24" }  // Use Soon
      ]
    });

    // 6. Seed Meal Plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        householdId: household.id,
        name: "Weekly Balanced Plan",
        weekStartDate: "2026-11-23",
        plannedMeals: {
          create: [
            { recipeId: recipe1.id, date: "2026-11-23", mealSlot: "DINNER", targetServings: 4 },
            { recipeId: recipe1.id, date: "2026-11-25", mealSlot: "LUNCH", targetServings: 2 }
          ]
        }
      }
    });

    // 7. Seed Smart Shopping List with Pantry Deductions
    await prisma.shoppingList.create({
      data: {
        householdId: household.id,
        name: "Week of Nov 23 Groceries",
        weekStartDate: "2026-11-23",
        items: {
          create: [
            { name: "chicken breast", quantity: 900, unit: "g", dimension: "MASS", aisle: "MEAT_SEAFOOD", checked: false, pantryDeducted: 0 },
            { name: "spinach", quantity: 125, unit: "g", dimension: "MASS", aisle: "PRODUCE", checked: false, pantryDeducted: 100, notes: "Subtracted 100g from refrigerator stock" }
          ]
        }
      }
    });

    console.log(`✓ Seeded demo user, household, recipes, pantry, and shopping list.`);
  }

  console.log("✅ Carewell Meal Planner App database seeding completed successfully.");
}

if (require.main === module) {
  seedMealPlannerDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
