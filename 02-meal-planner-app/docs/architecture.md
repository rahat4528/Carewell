# Meal Planner App - System Architecture

## 1. Architectural Overview

The Meal Planner App is engineered as a decoupled, multi-tier web application consisting of a Next.js frontend, an Express/TypeScript modular backend, an isolated PostgreSQL database (`carewell_meal_planner_db`), and a Redis-backed queue worker for asynchronous background jobs.

```
+-------------------------------------------------------------+
|                 Next.js Kitchen Planner UI                  |
| (Weekly Grid, Recipe Editor, Smart Shopping List, Pantry)   |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST
+------------------------------v------------------------------+
|                     Modular Backend API                     |
|  - AuthModule (Household RBAC, Multi-User Isolation)        |
|  - RecipesModule (Schema.org Importer, Scaling Engine)      |
|  - MealPlanModule (Weekly Scheduling, Templates, Dupes)     |
|  - ShoppingModule (Unit Normalization, Pantry Subtraction)  |
|  - PantryModule (Shelf-Life Tracking, Expiry Scanner)       |
|  - NutritionModule (FoodData Composition Table, Estimates)  |
|  - SsrfGuardService (Host Whitelisting, IP Blocklists)      |
+------------------------------+------------------------------+
                               | Prisma ORM
+------------------------------v------------------------------+
|             PostgreSQL (carewell_meal_planner_db)           |
|   Users, Households, Recipes, Ingredients, Steps, Plans,    |
|   PlannedMeals, ShoppingLists, PantryItems, FoodData        |
+-------------------------------------------------------------+
```

---

## 2. Core Algorithmic Engines

### 2.1 Serving Scaling & Rational Arithmetic Engine
Quantities are preserved as high-precision decimals (`DECIMAL(8, 2)`).
When a user alters target servings from base $S_{\text{base}}$ to target $S_{\text{target}}$:
$$Q_{\text{scaled}} = \begin{cases} Q_{\text{base}} & \text{if } \text{isScalable} = \text{false} \\ \text{round}\left(Q_{\text{base}} \times \frac{S_{\text{target}}}{S_{\text{base}}}, 2\right) & \text{if } \text{isScalable} = \text{true} \end{cases}$$

### 2.2 Ingredient Normalization & Shopping List Consolidation Engine
Ingredients with identical normalized names (e.g. "yellow onion" and "yellow onions") are merged if and only if they share compatible unit dimensions:

1. **Mass Dimension** (`g`, `kg`, `oz`, `lb`):
   Converted to base unit `grams` ($1 \text{ kg} = 1000\text{g}$, $1 \text{ oz} = 28.3495\text{g}$, $1 \text{ lb} = 453.592\text{g}$).
2. **Volume Dimension** (`ml`, `l`, `tsp`, `tbsp`, `cup`):
   Converted to base unit `milliliters` ($1 \text{ l} = 1000\text{ml}$, $1 \text{ tsp} = 4.92892\text{ml}$, $1 \text{ tbsp} = 14.7868\text{ml}$, $1 \text{ cup} = 236.588\text{ml}$).
3. **Count Dimension** (`count`, `clove`, `piece`, `can`):
   Aggregated directly if unit strings match.
4. **Dimension Mismatch Rule**:
   If an ingredient appears as $200\text{g}$ in Recipe A and $1\text{ cup}$ in Recipe B without a certified food density coefficient, the engine **refuses to guess** density. It produces two distinct items on the shopping list with an explanatory note.
5. **Pantry Stock Subtraction**:
   $$\text{Grocery Quantity} = \max\left(0, \text{Required Quantity} - \text{Pantry Quantity on Hand}\right)$$

### 2.3 Nutrition Estimation & Missing Data Engine
Nutrition is evaluated against a normalized Food Composition Table containing:
- Calories per 100g/unit
- Protein (g) per 100g/unit
- Carbohydrates (g) per 100g/unit
- Fat (g) per 100g/unit
- Fiber (g) per 100g/unit

**Incomplete Data Protocol**:
If an ingredient lacks nutrition entries in the database:
- The system computes the partial sum of known ingredients.
- It sets `nutritionStatus: "INCOMPLETE"`.
- It appends the missing ingredient names to `missingIngredients: string[]`.
- It emits a clear disclaimer: *"Partial estimate. Nutrition data unavailable for: [Item A, Item B]."*

### 2.4 SSRF-Protected Recipe Import Pipeline
To defend against Server-Side Request Forgery when scraping recipes:
1. Parse URL hostname and perform DNS resolution.
2. Check resolved IP against RFC 1918 private subnets, loopback (`127.0.0.1`), link-local (`169.254.0.0/16`), and AWS/GCP metadata endpoints (`169.254.169.254`).
3. If IP is internal, immediately throw a `403 Forbidden: SSRF Blocked` error.
4. Fetch response with strict constraints: timeout 5 seconds, max size 2 MB, max redirects 3.
5. Extract JSON-LD script blocks matching `@type: "Recipe"`.

---

## 3. Database Schema Overview (`carewell_meal_planner_db`)

- `User`: User identity and credentials.
- `Household`: Collaboration boundary.
- `HouseholdMember`: Role in household (`OWNER`, `MEMBER`, `VIEWER`).
- `Recipe`: Core recipe metadata, instructions, cuisine, category, servings.
- `RecipeIngredient`: Normalized ingredient name, quantity, unit, dimension, scalable flag.
- `CookingStep`: Sequenced preparation step.
- `MealPlan`: Named weekly plan.
- `PlannedMeal`: Specific recipe assignment to date (`YYYY-MM-DD`) and slot (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`) with target servings.
- `ShoppingList`: Active shopping list.
- `ShoppingListItem`: Consolidated item with aisle categorization, checked status, and pantry deduction notes.
- `PantryItem`: In-stock item with quantity, unit, storage location, and expiration date.
- `FoodComposition`: Reference table of verified macro and caloric data per 100g.
- `DietaryExclusion`: Allergies and preferences mapped to users and households.
