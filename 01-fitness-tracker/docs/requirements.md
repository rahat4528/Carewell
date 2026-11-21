# Fitness Tracker - System Requirements Specification

## 1. Executive Summary & Purpose

The **Fitness Tracker** (`01-fitness-tracker`) is a standalone, personal wellness and activity monitoring platform. It empowers users to plan workouts, record training sessions, monitor progressive overload, track physical activity and body measurements, and visualize progress against personal fitness goals.

> **CRITICAL MEDICAL DISCLAIMER**:
> The Fitness Tracker is strictly an informational personal tracking application. It does NOT offer medical diagnoses, clinical evaluations, or therapeutic workout prescriptions. It avoids generating diagnostic health-status labels (such as clinical obesity classifications). All calorie expenditures are calculated estimations based on metabolic equivalent tables. For medical advice or health clearance before exercise, users must consult licensed medical practitioners.

---

## 2. Core Functional Requirements

### 2.1 User Management & Preferences
- **Registration & Authentication**: Email/password registration with Argon2/bcrypt hashing, JWT session management, optional TOTP two-factor authentication, and rate-limited auth endpoints.
- **Fitness Profile**: User demographic parameters required for calculations (biological sex for basal metabolic rates, height in cm, weight in kg, birth date for age determination).
- **Unit Preferences**: Toggle between Metric (kg, cm, km) and Imperial (lbs, in, miles).
- **Canonical Storage Rule**: All database values are permanently stored in canonical metric units (kilograms, centimeters, meters, seconds). Unit conversion happens strictly at presentation boundaries.

### 2.2 Exercise Library
- **Exercise Catalog**: Seeded repository of resistance, bodyweight, and cardiovascular exercises.
- **Attributes**:
  - Name, description, execution instructions.
  - Category: `STRENGTH`, `CARDIO`, `FLEXIBILITY`, `CALISTHENICS`, `OLYMPIC`.
  - Primary & secondary Muscle Groups: `CHEST`, `BACK`, `LEGS_QUADRICEPS`, `LEGS_HAMSTRINGS`, `SHOULDERS`, `BICEPS`, `TRICEPS`, `CORE`, `CALVES`, `FULL_BODY`.
  - Equipment Required: `BARBELL`, `DUMBBELL`, `CABLE`, `MACHINE`, `BODYWEIGHT`, `KETTLEBELL`, `BANDS`.
- **Search & Filter**: Multi-attribute filtering by search string, muscle group, category, and equipment.
- **Custom Exercises**: Users can register custom private exercises scoped exclusively to their account.

### 2.3 Workout Management & Execution
- **Workout Plans & Templates**: Create reusable routines with designated exercise order, target set counts, rep ranges, target weights, and planned rest intervals.
- **Workout Sessions**:
  - State Machine: `PLANNED` -> `IN_PROGRESS` -> `COMPLETED` (or `SKIPPED`).
  - Active Session Tracking: Real-time set logging with weight (kg), reps, perceived exertion (RPE 1-10), and completion status.
  - Set Types: `WARMUP`, `NORMAL`, `DROPSET`, `FAILURE`.
- **Rest Timer**:
  - Configurable rest interval countdown between sets.
  - Timestamp-based synchronization to maintain accurate countdown across browser refreshes and background tabs.
  - Audible audio chime upon completion.
- **Training Calendar**:
  - Schedule workouts on upcoming calendar dates with optional weekly recurrence.
  - Past incomplete sessions transition automatically to `MISSED` state.

### 2.4 Progressive Overload & Analytics
- **Volume Load Calculation**:
  $$\text{Volume Load} = \sum (\text{sets} \times \text{reps} \times \text{weight})$$
- **Estimated One-Rep Max (Epley Formula)**:
  $$\text{1RM} = \text{weight} \times \left(1 + \frac{\text{reps}}{30}\right) \quad (\text{for } \text{reps} > 1)$$
  - For $\text{reps} = 1$, $\text{1RM} = \text{weight}$.
- **Personal Records (PRs)**:
  - Highest Weight Lifted
  - Maximum Repetitions at given weight
  - Peak Estimated 1RM
  - Maximum Session Volume
  - **Dynamic Recomputation**: Editing or deleting a set automatically triggers historical recalculation to ensure PR ledger integrity.

### 2.5 Activity Tracking
- **Daily Activity Records**: Steps, distance (meters), active duration (seconds), and estimated calories burned.
- **Data Provenance**:
  - Source: `MANUAL` vs. `DEVICE`.
  - Nature: `MEASURED` (steps, distance from pedometer) vs. `ESTIMATED` (calories).
- **Calorie Estimation Formula**:
  $$\text{Energy Expended (kcal)} = \text{MET} \times \text{Weight (kg)} \times \text{Duration (hours)}$$
  - Utilizes a standard Metabolic Equivalent of Task (MET) reference table.

### 2.6 Body Measurements
- **Metrics Tracked**: Body weight, chest, waist, hips, biceps, thighs, calves, neck circumference.
- **History & Trend Lines**: Track historical changes with moving averages.

### 2.7 Device Integration Adapter
- Modular adapter pattern supporting wearable sync (e.g., mock fixture provider for testing).
- Encrypted OAuth tokens (AES-256-GCM) with revocation capability.
- Deduplication via `externalRecordId`.

### 2.8 Data Sovereignty & Privacy
- **Complete Data Export**: One-click download of all user workouts, measurements, goals, and history in structured JSON format.
- **Right to Erasure (Account Deletion)**: Complete transactional cascading deletion of user account and all associated telemetry.

---

## 3. Permission & Access Control Matrix

| Resource | Anonymous | Authenticated User | Admin / System |
|---|---|---|---|
| Public Exercise Library | Read | Read | Read / Write |
| User Custom Exercises | None | Read / Write (Own only) | None |
| Workout Plans & Sessions | None | Full Control (Own only) | None |
| Body Measurements | None | Full Control (Own only) | None |
| Activity Records | None | Full Control (Own only) | None |
| Personal Records | None | Read (Own only) | Recompute |
| Device Credentials | None | Create / Revoke (Own only) | Encrypted Read |
| Export / Delete Profile | None | Execute (Own only) | None |
