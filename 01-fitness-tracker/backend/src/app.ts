import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.controller";
import exerciseRoutes from "./modules/exercises/exercises.controller";
import workoutRoutes from "./modules/workouts/workouts.controller";
import activityRoutes from "./modules/activity/activity.controller";
import measurementRoutes from "./modules/measurements/measurements.controller";
import analyticsRoutes from "./modules/analytics/analytics.controller";
import integrationRoutes from "./modules/integrations/device.controller";
import exportRoutes from "./modules/export/export.controller";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck & Metadata
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Carewell Fitness Tracker API",
      version: "1.0.0",
      canonicalUnits: "SI (kg, cm, m, s)",
      timestamp: new Date().toISOString()
    });
  });

  // Mount API v1 Routes
  const API_PREFIX = "/api/v1";
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}`, authRoutes); // mounts /profile under /api/v1
  app.use(`${API_PREFIX}/exercises`, exerciseRoutes);
  app.use(`${API_PREFIX}/workouts`, workoutRoutes);
  app.use(`${API_PREFIX}/activity`, activityRoutes);
  app.use(`${API_PREFIX}/measurements`, measurementRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${API_PREFIX}/integrations`, integrationRoutes);
  app.use(`${API_PREFIX}/export`, exportRoutes);

  return app;
}
