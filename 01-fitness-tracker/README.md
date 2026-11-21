# Fitness Tracker (`01-fitness-tracker`)

A modern personal wellness and activity monitoring dashboard. Monitor workout routines, track progressive overload across sets and repetitions, record body measurements, and visualize activity trends with estimated calorie expenditures.

---

## Features

- **Workout Builder & Execution**:
  - Structured plans with target weights, reps, and RPE.
  - Active session logging with set categorization (Warmup, Normal, Dropset, Failure).
  - Background-persistent rest timer with audible chime.
- **Progressive Overload Analytics**:
  - Automatic volume load calculation ($\sum \text{sets} \times \text{reps} \times \text{weight}$).
  - Dynamic estimated 1-Rep Max calculation using the Epley formula.
  - Personal Record (PR) milestone detection with automatic recomputation on set updates or deletions.
- **Activity & Body Metrics Tracking**:
  - Daily steps, active duration, and estimated calorie expenditure calculated via MET coefficients.
  - Clear distinction between `MEASURED` and `ESTIMATED` values, and `MANUAL` vs `DEVICE` sources.
  - Chronological body measurement tracking with moving averages.
- **Canonical Unit Integrity**:
  - Permanent database persistence in SI units (kg, cm, meters, seconds).
  - Lossless runtime conversion between Metric and Imperial display formats.
- **Privacy & Sovereignty**:
  - Full personal data JSON export.
  - Instant cascading account deletion.
  - No diagnostic claims or clinical judgments.

---

## Medical Disclaimer

> **IMPORTANT**: The Fitness Tracker is an informational wellness and fitness tool. It does not provide medical diagnoses, clinical treatment plans, or therapeutic prescriptions. All energy expenditure numbers are estimates derived from standard metabolic equivalent formulas. For health advice or medical clearance prior to engaging in physical training, consult a licensed healthcare professional.

---

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: NestJS / Express modular TypeScript service, Prisma ORM, BullMQ.
- **Database**: PostgreSQL 16 (`carewell_fitness_db`), Redis 7.
- **Testing**: Jest unit & integration test suites, Supertest.

---

## Local Development & Setup

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Backend Setup & Database Migration
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```
Backend runs on `http://localhost:4001`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3001`.

---

## Testing

Run unit tests, calculation validation, and integration tests:
```bash
cd backend
npm run test
```
