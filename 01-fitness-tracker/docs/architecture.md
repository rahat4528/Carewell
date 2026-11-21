# Fitness Tracker - System Architecture

## 1. Architectural Overview

The Fitness Tracker is constructed as a decoupled, modern multi-tier web application consisting of a responsive Next.js frontend, an enterprise NestJS backend API, a PostgreSQL transactional relational database, and a Redis-backed queue worker for asynchronous telemetry ingestion.

```
+-------------------------------------------------------------+
|                      Next.js Frontend                       |
| (Dashboard, Workout Builder, Recharts, Responsive UI)      |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST
+------------------------------v------------------------------+
|                     NestJS Backend API                      |
|  - AuthModule (JWT, Argon2, RateLimiting)                   |
|  - ExercisesModule (Catalog, Filter, Search)                |
|  - WorkoutsModule (Plans, Sessions, Active Sets, Timers)    |
|  - OverloadModule (Volume, 1RM Epley Engine, PR Ledger)     |
|  - ActivityModule (MET Calorie Estimator, Steps, Distance)  |
|  - MeasurementsModule (Body Metrics, Canonical Units)       |
|  - IntegrationModule (Wearable Adapters, OAuth, Ingestion)   |
|  - ExportModule (GDPR JSON Export & Cascading Purge)        |
+------------------------------+------------------------------+
                               | Prisma ORM (Strict Relations)
+------------------------------v------------------------------+
|                PostgreSQL (carewell_fitness_db)             |
|   Users, Profiles, Exercises, Plans, Sessions, Sets,        |
|   Activities, Measurements, PersonalRecords, AuditLogs      |
+-------------------------------------------------------------+
```

---

## 2. Mathematical & Algorithmic Engines

### 2.1 Canonical Unit Engine
To ensure absolute mathematical integrity across international standards, the database persists physical measurements exclusively in SI units:
- **Mass / Weight**: Kilograms (`kg`) with `DECIMAL(6, 2)` precision.
- **Length / Circumference**: Centimeters (`cm`) with `DECIMAL(6, 2)` precision.
- **Distance**: Meters (`m`) with `DECIMAL(8, 2)` precision.
- **Time**: Seconds (`s`) as integer counts.

**Unit Conversion Factors**:
- $1 \text{ kg} = 2.20462262185 \text{ lbs}$
- $1 \text{ cm} = 0.3937007874 \text{ inches}$
- $1 \text{ meter} = 0.000621371192 \text{ miles}$

Conversion functions are symmetric and verified against floating-point drift:
$$\text{DisplayWeight}(\text{kg}, \text{unit}) = \begin{cases} \text{kg} & \text{if unit} = \text{METRIC} \\ \text{round}(\text{kg} \times 2.20462, 2) & \text{if unit} = \text{IMPERIAL} \end{cases}$$

### 2.2 Estimated One-Repetition Maximum (1RM) Engine
Calculated using the validated Epley formula:
$$1\text{RM} = \begin{cases} w & \text{if } r = 1 \\ w \times \left(1 + \frac{r}{30}\right) & \text{if } r > 1 \end{cases}$$
Where $w$ is weight lifted in kg, and $r$ is completed repetition count ($1 \le r \le 30$).

### 2.3 Calorie Expenditure Estimation Engine
Caloric expenditure is derived from the standard Compendium of Physical Activities MET formulation:
$$\text{Calories Burned (kcal)} = \text{MET} \times \text{Weight}_{\text{kg}} \times \left(\frac{\text{Duration}_{\text{minutes}}}{60}\right)$$

Standard MET Reference Constants:
- Walking (moderate 4.8 km/h): `3.5`
- Running (jogging 8.0 km/h): `8.0`
- Resistance Training (vigorous): `6.0`
- Cycling (moderate): `6.8`
- High-Intensity Interval Training (HIIT): `9.0`
- Yoga / Stretching: `2.5`

All output displayed to users includes the explicit indicator: `ESTIMATED (MET Model v1)`.

---

## 3. Database Schema Design (`carewell_fitness_db`)

The schema employs strict foreign key constraints, composite unique indexes, check constraints, and cascading integrity:

- `User`: Core authentication record (`id`, `email`, `passwordHash`, `role`, `createdAt`).
- `FitnessProfile`: Demographic attributes (`userId`, `heightCm`, `weightKg`, `unitSystem`, `biologicalSex`, `birthDate`).
- `Exercise`: Normalized exercise definitions (`id`, `name`, `category`, `primaryMuscle`, `equipment`, `isCustom`, `ownerId`).
- `WorkoutPlan`: Reusable training blueprints (`id`, `userId`, `name`, `description`).
- `WorkoutSession`: Live execution instances (`id`, `userId`, `planId`, `status`, `startedAt`, `completedAt`, `notes`).
- `WorkoutExercise`: Exercises attached to a session (`id`, `sessionId`, `exerciseId`, `order`).
- `WorkoutSet`: Specific sets performed (`id`, `workoutExerciseId`, `setNumber`, `type`, `weightKg`, `reps`, `rpe`, `completed`).
- `PersonalRecord`: Historical peak milestones (`id`, `userId`, `exerciseId`, `recordType`, `value`, `estimated1Rm`, `achievedAt`).
- `ActivityRecord`: Daily physical activity entries (`id`, `userId`, `date`, `steps`, `distanceMeters`, `durationSeconds`, `caloriesBurned`, `source`, `nature`).
- `BodyMeasurement`: Historical body dimensions (`id`, `userId`, `date`, `metricType`, `valueCm`, `source`).
- `FitnessGoal`: User objectives (`id`, `userId`, `metricType`, `targetValue`, `startValue`, `startDate`, `targetDate`, `status`).
- `DeviceIntegration`: Linked wearable connections (`id`, `userId`, `provider`, `encryptedToken`, `lastSyncAt`, `status`).

---

## 4. Security & Privacy Guarantees

1. **User Isolation**: Every database query on user-specific tables includes a mandatory `WHERE userId = :currentUserId` predicate verified at the service layer.
2. **Encrypted Wearable Tokens**: Access and refresh tokens for connected devices are encrypted using AES-256-GCM before storage, with keys held in protected environment variables.
3. **Data Portability & Erasure**: Compliant with data protection best practices; supports full JSON data download and complete account eradication with audit logging.
