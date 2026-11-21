import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.controller";
import recipeRoutes from "./modules/recipes/recipes.controller";
import mealPlanRoutes from "./modules/meal-plans/meal-plans.controller";
import shoppingRoutes from "./modules/shopping/shopping.controller";
import pantryRoutes from "./modules/pantry/pantry.controller";
import nutritionRoutes from "./modules/nutrition/nutrition.controller";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // Healthcheck & Metadata
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Carewell Meal Planner App API",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  });

  const API_PREFIX = "/api/v1";
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}`, authRoutes); // mounts /households/current
  app.use(`${API_PREFIX}/recipes`, recipeRoutes);
  app.use(`${API_PREFIX}/meal-plans`, mealPlanRoutes);
  app.use(`${API_PREFIX}/shopping-list`, shoppingRoutes);
  app.use(`${API_PREFIX}/pantry`, pantryRoutes);
  app.use(`${API_PREFIX}/nutrition`, nutritionRoutes);

  return app;
}
