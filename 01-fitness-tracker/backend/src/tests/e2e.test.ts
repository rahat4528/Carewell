/**
 * Carewell Fitness Tracker - Cross-Cutting End-to-End Test Suite
 * 
 * Validates the complete lifecycle:
 * 1. User Registration & Onboarding
 * 2. Profile Setup & Canonical Metric Conversion
 * 3. Exercise Search & Custom Exercise Registration
 * 4. Workout Session Construction & Live Execution
 * 5. Dynamic PR Detection (Epley 1RM, Heaviest Weight, Volume Load)
 * 6. Daily Activity Logging with MET Calorie Estimation
 * 7. Body Measurement Tracking
 * 8. GDPR/Data Sovereignty JSON Export & Account Erasure
 */

import request from "supertest";
import { createApp } from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

describe("E2E Cross-Cutting Fitness Tracker Workflow", () => {
  const runId = Date.now();
  const testEmail = `e2e_athlete_${runId}@carewell.local`;
  let authToken: string;
  let userId: string;
  let customExId: string;
  let sessionId: string;
  let workoutExId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("1. System Health & Protocol Availability", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toContain("Fitness Tracker");
  });

  test("2. User Registration & Profile Creation", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: "SecureAthletePass2026!",
        name: "Jordan Lee",
        unitSystem: "METRIC",
        heightCm: 180.0,
        weightKg: 78.0,
        biologicalSex: "MALE"
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  test("3. Exercise Discovery & Private Custom Exercise Creation", async () => {
    // Browse Catalog
    const catalogRes = await request(app)
      .get("/api/v1/exercises?category=STRENGTH")
      .set("Authorization", `Bearer ${authToken}`);
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.length).toBeGreaterThan(0);

    // Create Private Custom Exercise
    const customRes = await request(app)
      .post("/api/v1/exercises")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: `Jordan Paused Front Squat ${runId}`,
        category: "STRENGTH",
        primaryMuscle: "LEGS_QUADRICEPS",
        equipment: "BARBELL",
        instructions: "Pause 3 seconds at bottom of squat."
      });

    expect(customRes.status).toBe(201);
    customExId = customRes.body.id;
  });

  test("4. Workout Session Execution & Set Logging", async () => {
    // Create live session
    const sessionRes = await request(app)
      .post("/api/v1/workouts/sessions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Leg Hypertrophy Session" });

    expect(sessionRes.status).toBe(201);
    sessionId = sessionRes.body.id;

    // Attach custom exercise to session
    const attachRes = await request(app)
      .post(`/api/v1/workouts/sessions/${sessionId}/exercises`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ exerciseId: customExId, orderIndex: 0 });

    expect(attachRes.status).toBe(201);
    workoutExId = attachRes.body.id;

    // Log Sets
    const set1 = await request(app)
      .post(`/api/v1/workouts/exercises/${workoutExId}/sets`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ setNumber: 1, setType: "WARMUP", weightKg: 70, reps: 10, completed: true });
    expect(set1.status).toBe(201);

    const set2 = await request(app)
      .post(`/api/v1/workouts/exercises/${workoutExId}/sets`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ setNumber: 2, setType: "NORMAL", weightKg: 100, reps: 6, completed: true });
    expect(set2.status).toBe(201);

    // Complete Session
    const completeRes = await request(app)
      .post(`/api/v1/workouts/sessions/${sessionId}/complete`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe("COMPLETED");
    expect(completeRes.body.totalVolumeKg).toBe(70 * 10 + 100 * 6); // 1300 kg
  });

  test("5. Dynamic Personal Record & Analytics Verification", async () => {
    const prRes = await request(app)
      .get("/api/v1/analytics/personal-records")
      .set("Authorization", `Bearer ${authToken}`);

    expect(prRes.status).toBe(200);
    const customPr = prRes.body.find((p: any) => p.exerciseId === customExId);
    expect(customPr).toBeDefined();
    expect(customPr.value).toBe(100); // 100 kg heaviest weight
    // Epley 1RM for 100kg x 6 reps: 100 * (1 + 6/30) = 120 kg
    expect(customPr.estimated1Rm).toBe(120);
  });

  test("6. Daily Activity Recording with Estimated MET Calories", async () => {
    const actRes = await request(app)
      .post("/api/v1/activity/daily")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        date: "2026-11-21",
        steps: 10200,
        distanceMeters: 7800,
        durationSeconds: 3600,
        activityType: "RUNNING_JOGGING"
      });

    expect(actRes.status).toBe(201);
    expect(actRes.body.nature).toBe("ESTIMATED");
    expect(actRes.body.calorieMetadata.nature).toBe("ESTIMATED");
    expect(actRes.body.estimatedCalories).toBeGreaterThan(400);
  });

  test("7. Body Measurements Recording with Lossless Unit Support", async () => {
    const measRes = await request(app)
      .post("/api/v1/measurements")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        date: "2026-11-21",
        metricType: "WEIGHT_KG",
        value: 77.5
      });
    expect(measRes.status).toBe(201);
    expect(measRes.body.value).toBe(77.5);
  });

  test("8. Complete Personal Data Export & Account Erasure", async () => {
    const exportRes = await request(app)
      .get("/api/v1/export/data")
      .set("Authorization", `Bearer ${authToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.body.exportMetadata.system).toBe("Carewell Fitness Tracker");
    expect(exportRes.body.sessions.length).toBeGreaterThanOrEqual(1);

    const deleteRes = await request(app)
      .delete("/api/v1/export/account")
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
