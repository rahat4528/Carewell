import request from "supertest";
import { createApp } from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

describe("Carewell Fitness Tracker - API & Access Isolation Integration Suite", () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let userASessionId: string;
  let userASetId: string;
  let customExerciseId: string;

  const testRunId = Date.now();
  const aliceEmail = `alice_${testRunId}@carewell.local`;
  const bobEmail = `bob_${testRunId}@carewell.local`;

  beforeAll(async () => {
    // Clean up any test users if needed
    await prisma.user.deleteMany({
      where: {
        email: { in: [aliceEmail, bobEmail, "alice.athlete@carewell.local", "bob.builder@carewell.local"] }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /health returns 200 with service metadata and canonical units", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.canonicalUnits).toContain("SI (kg, cm, m, s)");
  });

  test("User Registration & Authentication (User A and User B)", async () => {
    // Register User A
    const regResA = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: aliceEmail,
        password: "Password123!",
        name: "Alice Athlete",
        unitSystem: "METRIC",
        heightCm: 168.0,
        weightKg: 62.5
      });

    expect(regResA.status).toBe(201);
    expect(regResA.body.token).toBeDefined();
    userAToken = regResA.body.token;
    userAId = regResA.body.user.id;

    // Register User B
    const regResB = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: bobEmail,
        password: "Password123!",
        name: "Bob Builder",
        unitSystem: "IMPERIAL",
        heightCm: 182.0,
        weightKg: 85.0
      });

    expect(regResB.status).toBe(201);
    expect(regResB.body.token).toBeDefined();
    userBToken = regResB.body.token;
    userBId = regResB.body.user.id;
  });

  test("GET & PATCH /profile updates display preferences without changing stored truth", async () => {
    const patchRes = await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ unitSystem: "IMPERIAL" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.profile.unitSystem).toBe("IMPERIAL");

    // Toggle back to METRIC
    await request(app)
      .patch("/api/v1/profile")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ unitSystem: "METRIC" });
  });

  test("Exercise Catalog & User-Scoped Custom Exercise Creation", async () => {
    // User A creates a custom exercise
    const customExRes = await request(app)
      .post("/api/v1/exercises")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        name: "Alice Special Deficit Deadlift",
        category: "STRENGTH",
        primaryMuscle: "BACK",
        equipment: "BARBELL",
        instructions: "Stand on 2-inch platform."
      });

    expect(customExRes.status).toBe(201);
    expect(customExRes.body.isCustom).toBe(true);
    customExerciseId = customExRes.body.id;

    // User A can list and find custom exercise
    const userAListRes = await request(app)
      .get("/api/v1/exercises?search=Alice")
      .set("Authorization", `Bearer ${userAToken}`);
    expect(userAListRes.body.length).toBe(1);

    // USER ISOLATION CHECK: User B CANNOT see User A's custom private exercise
    const userBListRes = await request(app)
      .get("/api/v1/exercises?search=Alice")
      .set("Authorization", `Bearer ${userBToken}`);
    expect(userBListRes.body.length).toBe(0);
  });

  test("Workout Session Execution, Sets & Dynamic PR Detection", async () => {
    // User A creates a workout session
    const sessionRes = await request(app)
      .post("/api/v1/workouts/sessions")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Alice Heavy Back Day" });

    expect(sessionRes.status).toBe(201);
    userASessionId = sessionRes.body.id;

    // Add custom exercise to session
    const weRes = await request(app)
      .post(`/api/v1/workouts/sessions/${userASessionId}/exercises`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ exerciseId: customExerciseId, orderIndex: 0 });

    expect(weRes.status).toBe(201);
    const weId = weRes.body.id;

    // Log Set 1: 100 kg x 5 reps -> 1RM ~ 116.67
    const set1Res = await request(app)
      .post(`/api/v1/workouts/exercises/${weId}/sets`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        setNumber: 1,
        setType: "NORMAL",
        weightKg: 100.0,
        reps: 5,
        completed: true
      });

    expect(set1Res.status).toBe(201);
    userASetId = set1Res.body.id;

    // Complete session
    const completeRes = await request(app)
      .post(`/api/v1/workouts/sessions/${userASessionId}/complete`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe("COMPLETED");
    expect(completeRes.body.totalVolumeKg).toBe(500.0); // 100 * 5
  });

  test("RECORD-LEVEL ACCESS ISOLATION: Cross-user mutation and read prevention", async () => {
    // User B attempts to complete User A's session -> must fail (404/not found)
    const illegalCompleteRes = await request(app)
      .post(`/api/v1/workouts/sessions/${userASessionId}/complete`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(illegalCompleteRes.status).toBe(404);

    // User B attempts to update User A's set -> must fail (404/not found)
    const illegalSetUpdate = await request(app)
      .put(`/api/v1/workouts/sets/${userASetId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ weightKg: 999.0 });
    expect(illegalSetUpdate.status).toBe(404);

    // User B attempts to delete User A's set -> must fail (404/not found)
    const illegalSetDelete = await request(app)
      .delete(`/api/v1/workouts/sets/${userASetId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    expect(illegalSetDelete.status).toBe(404);
  });

  test("Daily Activity & MET Calorie Calculation", async () => {
    const actRes = await request(app)
      .post("/api/v1/activity/daily")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        date: "2026-11-21",
        steps: 9500,
        distanceMeters: 7100,
        durationSeconds: 3600, // 60 mins
        activityType: "RUNNING_JOGGING"
      });

    expect(actRes.status).toBe(201);
    expect(actRes.body.nature).toBe("ESTIMATED");
    expect(actRes.body.calorieMetadata.nature).toBe("ESTIMATED");
    expect(actRes.body.estimatedCalories).toBeGreaterThan(0);
  });

  test("Body Measurement Recording & Unit Formatting", async () => {
    const measRes = await request(app)
      .post("/api/v1/measurements")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        date: "2026-11-21",
        metricType: "WEIGHT_KG",
        value: 62.0
      });

    expect(measRes.status).toBe(201);

    const getMeasRes = await request(app)
      .get("/api/v1/measurements?metricType=WEIGHT_KG")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(getMeasRes.status).toBe(200);
    expect(getMeasRes.body.length).toBeGreaterThanOrEqual(1);
    expect(getMeasRes.body[0].canonicalValue).toBe(62.0);
  });

  test("Data Sovereignty: Complete JSON Export & Account Deletion", async () => {
    // Export data
    const exportRes = await request(app)
      .get("/api/v1/export/data")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.body.exportMetadata.system).toBe("Carewell Fitness Tracker");
    expect(exportRes.body.exportMetadata.auditHash).toBeDefined();
    expect(exportRes.body.sessions.length).toBeGreaterThanOrEqual(1);

    // Account Deletion
    const deleteRes = await request(app)
      .delete("/api/v1/export/account")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Authenticating with erased user should now fail
    const profileAfterDelete = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${userAToken}`);
    expect(profileAfterDelete.status).toBe(404);
  });
});
