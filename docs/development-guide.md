# Carewell Development Guide

This guide details local environment setup, application isolation guidelines, and testing procedures for the Carewell repository.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- **Docker & Docker Compose**: v24+ for local database and cache services
- **Git**

---

## Working with Independent Applications

Each application lives in its own subdirectory (`01-fitness-tracker`, `02-meal-planner-app`, etc.) and must be operated independently.

### 1. Starting an Application Stack
To launch an application, navigate into its folder:

```bash
cd 01-fitness-tracker

# 1. Start local dependencies (Postgres, Redis)
docker-compose up -d

# 2. Configure environment
cp .env.example .env

# 3. Setup backend dependencies and database
cd backend
npm install
npx prisma migrate dev --name init
npm run seed

# 4. Run backend
npm run start:dev

# 5. Setup and run frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

### 2. Running Automated Tests
Unit, integration, and security tests must be executed from each project directory:

```bash
cd 01-fitness-tracker/backend
npm run test
npm run test:e2e
```

### 3. Isolation & Independence Principles
- Never import files across sibling project folders.
- Never connect one application's backend to another application's database.
- Database ports in `docker-compose.yml` are assigned unique host ports (e.g., 5431 for fitness, 5432 for meal planner, 5433 for appointments, 5434 for pharmacy, 5435 for hospital) to allow concurrent local debugging if desired.
