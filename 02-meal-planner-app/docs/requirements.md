# Meal Planner App - System Requirements Specification

## 1. Executive Summary & Purpose

The **Meal Planner App** (`02-meal-planner-app`) is a standalone, household-aware culinary logistics and nutrition management system. It provides families and individuals with tools to organize personal recipe collections, plan balanced weekly meal schedules, dynamically scale ingredient quantities, generate aisle-categorized grocery lists with pantry stock deduction, monitor pantry shelf-life, and observe estimated nutritional intakes.

> **CRITICAL CLINICAL & NUTRITIONAL DISCLAIMER**:
> The Meal Planner App is strictly an informational kitchen logistics and recipe organizational tool. It does NOT operate as a registered dietitian, certified clinical nutritionist, or medical provider. It does NOT prescribe therapeutic diets for medical conditions (such as diabetic, renal, or ketogenic protocols). All macro and micronutrient figures are calculated estimations based on public food composition tables. Users with allergies, celiac disease, or specific metabolic requirements must verify manufacturer packaging labels directly. In the event of an acute allergic reaction, users must contact local emergency services immediately.

---

## 2. Core Functional Requirements

### 2.1 User Management & Household Collaboration
- **Authentication**: Email/password registration with bcrypt hashing, JWT session tokens, and user profile management.
- **Household Structure**: Multi-user household accounts (`OWNER`, `MEMBER`, `VIEWER`).
- **Shared Access**: Meal calendars, recipe books, pantry inventories, and shopping lists are scoped to household context.
- **Dietary Exclusions & Allergen Flags**: Configurable per-user and per-household dietary tags (`VEGAN`, `VEGETARIAN`, `DAIRY_FREE`, `GLUTEN_FREE`, `NUT_FREE`, `SHELLFISH_FREE`).

### 2.2 Recipe Catalog & Management
- **Recipe Attributes**: Title, summary description, prep duration, cooking duration, total time, base servings, cuisine type, meal category (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`), dietary tags.
- **Cooking Steps**: Sequenced instructions with optional timer duration tags.
- **Ingredient Structure**: Normalized ingredient reference, exact quantity, unit of measure (`g`, `kg`, `ml`, `l`, `cup`, `tbsp`, `tsp`, `oz`, `lb`, `count`), preparation notes (e.g., "finely diced"), and scalable flag (e.g., salt "to taste" marked as non-scalable).
- **Substitutions**: Informational substitution tables (e.g., Greek yogurt for sour cream at a 1:1 ratio) with explicit notes that substitutions are not verified medical or allergen-safe advice.

### 2.3 Serving Scaling & Exact Arithmetic
- **Exact Rational/Decimal Scaling**:
  $$\text{Scaled Quantity} = \text{Base Quantity} \times \left(\frac{\text{Target Servings}}{\text{Base Servings}}\right)$$
- **Non-Scalable Ingredients**: Ingredients marked as `isScalable: false` (e.g. "salt to taste", "oil for frying") maintain fixed text descriptions regardless of scaling multipliers.
- **Dimensional Integrity**: Strict enforcement of unit dimensions:
  - `MASS`: `g`, `kg`, `oz`, `lb`
  - `VOLUME`: `ml`, `l`, `tsp`, `tbsp`, `cup`, `fl_oz`
  - `COUNT`: `piece`, `clove`, `slice`, `can`, `item`
  - `OTHER`: non-convertible items

### 2.4 Weekly Meal Calendar
- **Grid Layout**: 7-day schedule (Monday to Sunday) segmented by meal slots (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
- **Planned Meals**: Assign recipes with custom target servings for specific dates and meal slots.
- **Plan Duplication & Templates**: Save successful weeks as reusable templates or duplicate past weeks.
- **Daily Nutritional Estimates**: Immediate roll-up of estimated calories, protein, carbs, and fat per planned day.

### 2.5 Intelligent Shopping List Engine
- **Recipe-to-List Compilation**: Aggregates all ingredients across planned meals for a chosen date window.
- **Unit Normalization & Dimension Merging**: Merges identical ingredients within compatible dimensions (e.g., 250g + 500g = 750g; 1 cup + 2 tbsp = 1.125 cups). Incompatible dimensions (e.g. mass vs volume without known density) remain on separate distinct list rows.
- **Pantry Subtraction**: Automatically deducts in-stock pantry items from shopping list quantities.
- **Aisle Categorization**: Groups grocery items into physical store aisles (`PRODUCE`, `MEAT_SEAFOOD`, `DAIRY`, `PANTRY_BAKING`, `SPICES`, `BAKERY`, `FROZEN`, `BEVERAGES`).
- **Real-Time Check-Off**: Items checked off update across all household members.
- **Export Options**: Export to plain text, CSV, and printable shopping checklists.

### 2.6 Pantry Inventory & Expiry Alerts
- **Pantry Items**: Ingredient name, quantity on hand, unit, storage location (`PANTRY`, `REFRIGERATOR`, `FREEZER`), purchase date, and expiration date.
- **"Use Soon" Views**: Filter items approaching expiration within 3, 5, or 7 days.
- **Scheduled Expiry Alerts**: Background worker detecting expired and near-expiry items.

### 2.7 Nutritional Estimation & Data Provenance
- **Food Composition Data**: Grounded in public standard nutritional composition tables (e.g., USDA FoodData Central open reference data).
- **Incomplete Data Handling**: Recipes containing ingredients without verified nutritional composition tables calculate partial totals, explicitly flag the recipe summary as `"INCOMPLETE"`, and itemize which ingredients are uncalculated.
- **User Nutrition Targets**: Purely elective numeric targets set by the user (e.g., target 2,000 kcal, 130g protein); never system-prescribed clinical diets.

### 2.8 Recipe URL Importer with SSRF Defense
- **Server-Side Import**: Fetches web pages to extract Schema.org `Recipe` JSON-LD metadata.
- **Server-Side Request Forgery (SSRF) Protection**:
  - Rejection of private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
  - Strict protocol enforcement (HTTP/HTTPS only).
  - Maximum response size limit (2 MB) and timeout (5000 ms).
  - Maximum 3 redirect hops.
- **Provenance & Review**: Stores source URL and presents a preview for user review before database persistence.

---

## 3. Permission & Access Matrix

| Resource | Household Owner | Household Member | Household Viewer | External User |
|---|---|---|---|---|
| Household Recipes | Read / Write / Delete | Read / Write | Read Only | No Access |
| Meal Plans | Read / Write / Delete | Read / Write | Read Only | No Access |
| Shopping Lists | Read / Write / Toggle | Read / Write / Toggle | Read Only | No Access |
| Pantry Inventory | Read / Write / Delete | Read / Write | Read Only | No Access |
| Household Membership | Invite / Remove | View Members | View Members | No Access |
| Nutritional Logs | Read / Write | Read / Write | Read Only | No Access |
