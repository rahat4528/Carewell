# Fitness Tracker - REST API Documentation

Base URL: `/api/v1`

All authenticated endpoints require an `Authorization: Bearer <JWT>` header unless specified as public.

---

## 1. Authentication & Profile

### `POST /auth/register`
Creates a new user account and associated fitness profile.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Jane Doe",
    "unitSystem": "METRIC",
    "heightCm": 172.5,
    "weightKg": 68.0,
    "biologicalSex": "FEMALE",
    "birthDate": "1994-06-15"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "usr_...", "email": "user@example.com", "name": "Jane Doe" }
  }
  ```

### `POST /auth/login`
Authenticates existing user.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `200 OK` with JWT token and profile details.

### `GET /profile`
Retrieves current user profile, unit preferences, and basal parameters.

### `PATCH /profile`
Updates unit preferences (`METRIC` or `IMPERIAL`), target goals, or personal details.

---

## 2. Exercise Catalog

### `GET /exercises`
Returns catalog of standard and user-custom exercises with query filtering.
- **Query Parameters**:
  - `search`: string
  - `category`: `STRENGTH` | `CARDIO` | `FLEXIBILITY` | `CALISTHENICS`
  - `muscle`: `CHEST` | `BACK` | `LEGS_QUADRICEPS` | `SHOULDERS` | etc.
  - `equipment`: `BARBELL` | `DUMBBELL` | `CABLE` | `BODYWEIGHT` | etc.
- **Response**: `200 OK` - Array of Exercise objects.

### `POST /exercises`
Registers a private, custom exercise for the current user.
- **Request Body**:
  ```json
  {
    "name": "Paused Incline Dumbbell Press",
    "category": "STRENGTH",
    "primaryMuscle": "CHEST",
    "equipment": "DUMBBELL",
    "instructions": "Hold 2 second pause at full stretch."
  }
  ```

---

## 3. Workouts & Sessions

### `POST /workouts/plans`
Creates a reusable training template / plan.

### `GET /workouts/sessions`
Lists user's workout sessions with pagination and date filtering.

### `POST /workouts/sessions`
Initializes a new workout session (`PLANNED` or `IN_PROGRESS`).

### `POST /workouts/sessions/:id/exercises`
Adds an exercise to an active session with initial set targets.

### `POST /workouts/exercises/:id/sets`
Records an executed set with weight (kg), reps, RPE, and set type.
Automatically updates Personal Records (PRs) if thresholds are exceeded.

### `PUT /workouts/sets/:id`
Updates an existing set. Recomputes volume load and historical PRs.

### `DELETE /workouts/sets/:id`
Removes a set and recalculates PR records if the deleted set held a record.

### `POST /workouts/sessions/:id/complete`
Transitions session status to `COMPLETED`, records session duration and total volume load.

---

## 4. Analytics & Progressive Overload

### `GET /analytics/personal-records`
Retrieves user's PR milestones per exercise (highest weight, highest volume, peak estimated 1RM).

### `GET /analytics/overload-trends`
Returns historical volume load time-series aggregated by exercise and muscle group.

### `GET /analytics/dashboard-summary`
Aggregates weekly workout counts, completion rates, current streaks, and recent activity rings.

---

## 5. Activity Tracking & Body Measurements

### `GET /activity/daily`
Fetches daily step counts, active duration, distance, and estimated calorie expenditure.

### `POST /activity/daily`
Records activity metrics (manual entry or device adapter payload).
- Automatically calculates estimated calories using MET coefficients and user body weight.

### `GET /measurements`
Retrieves chronological body measurement log (weight, waist, chest, arms).

### `POST /measurements`
Inserts a new body measurement entry in canonical metric units.

---

## 6. Device Integration & Data Sovereignty

### `POST /integrations/sync`
Triggers synchronization from a configured device adapter (e.g., test fixture adapter). Deduplicates by external record ID.

### `GET /export/data`
Downloads complete user data snapshot in structured JSON format.

### `DELETE /export/account`
Irrevocably deletes the authenticated user, credentials, and all recorded data.
