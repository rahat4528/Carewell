# Meal Planner App (`02-meal-planner-app`)

A warm, household-centric kitchen planner and culinary logistics platform. Organize personal recipes, schedule weekly meals, scale ingredient quantities with exact arithmetic, generate aisle-grouped grocery lists with automated pantry subtraction, and track estimated nutrition.

---

## Features

- **Recipe Catalog & Management**:
  - Structured recipe details with cooking steps, prep times, base servings, and cuisine classifications.
  - Informational ingredient substitutions with advisory notices.
  - Dynamic serving scaling ($Q_{\text{scaled}} = Q_{\text{base}} \times \frac{S_{\text{target}}}{S_{\text{base}}}$) keeping non-scalable ingredients ("to taste") intact.
- **Weekly Meal Planner Calendar**:
  - Drag-and-drop 7-day schedule with Breakfast, Lunch, Dinner, and Snack rows.
  - Plan duplication and reusable weekly templates.
  - Daily estimated macronutrient roll-ups.
- **Intelligent Shopping List**:
  - Recipe-to-grocery compilation with unit dimension normalization (Mass: g/kg/oz/lb; Volume: ml/l/cup/tbsp/tsp).
  - Cross-dimension mismatch protection (avoids converting mass to volume without density data).
  - Automated pantry inventory deduction ($\max(0, \text{Required} - \text{Pantry})$).
  - Aisle categorization (Produce, Meat/Seafood, Dairy, Pantry/Baking, Spices, Bakery).
  - Real-time check-off syncing across household members and multi-format exports (CSV, Text).
- **Pantry Inventory & Shelf-Life**:
  - Track in-stock goods, storage locations, purchase dates, and expiry dates.
  - "Use Soon" alerts for items expiring within 5 days.
- **Nutritional Estimation & Transparency**:
  - Macro and calorie estimates grounded in open food composition tables.
  - Missing data detection with explicit `INCOMPLETE` labeling and uncalculated item lists.
  - Non-diagnostic disclaimers: no clinical diet prescriptions.
- **SSRF-Defended Recipe Import**:
  - Schema.org Recipe JSON-LD parser with strict RFC 1918 internal IP rejection.

---

## Medical & Nutritional Disclaimer

> **IMPORTANT**: The Meal Planner App is an organizational kitchen tool. It does not provide clinical nutrition therapy, medical diet prescriptions, or allergy management advice. All macro and calorie values are calculated estimates based on public composition tables. Users must inspect physical ingredient labels for allergens. In case of an emergency, contact local emergency services immediately.

---

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Express modular TypeScript service, Prisma ORM, BullMQ.
- **Database**: PostgreSQL 16 (`carewell_meal_planner_db`), Redis 7.
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
npx prisma db push
npm run seed
npm run start:dev
```
Backend runs on `http://localhost:4002`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3002`.

---

## Testing

Run unit tests, calculation validation, and integration tests:
```bash
cd backend
npm run test
```
