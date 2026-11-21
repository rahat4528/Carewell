import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.controller";
import doctorRoutes from "./modules/doctors/doctors.controller";
import appointmentRoutes from "./modules/appointments/appointments.controller";
import adminRoutes from "./modules/admin/admin.controller";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck & Protocol
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Carewell Doctor Appointment System API",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  });

  const API_PREFIX = "/api/v1";
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}`, authRoutes); // mounts /profile
  app.use(`${API_PREFIX}/doctors`, doctorRoutes);
  app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  return app;
}
