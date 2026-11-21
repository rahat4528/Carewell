# Meal Planner App - REST API Documentation

Base URL: `/api/v1`

---

## 1. Authentication & Household

### `POST /auth/register`
Creates user and generates a default personal Household.

### `POST /auth/login`
Authenticates user, returns JWT and household context.

### `GET /households/current`
Retrieves current household details, members, and dietary preferences.

---

## 2. Recipes

### `GET /recipes`
Lists household recipes with search query, meal category, and dietary filters.

### `POST /recipes`
Creates a new recipe with ingredients, cooking steps, and dietary tags.

### `GET /recipes/:id`
Retrieves recipe details, scaled quantities for specified `?servings=N`, and estimated nutrition status.

### `POST /recipes/import`
Imports recipe from a public URL via SSRF-protected parser.
- **Request Body**: `{ "url": "https://example.com/recipes/healthy-quinoa-bowl" }`
- **SSRF Defense**: Rejects any internal IP (`127.0.0.1`, `10.x.x.x`, `169.254.x.x`).

---

## 3. Meal Planning & Scheduling

### `GET /meal-plans/weekly`
Fetches planned meals for a 7-day date range (`?startDate=YYYY-MM-DD`).

### `POST /meal-plans/assign`
Assigns a recipe to a date and meal slot with custom target servings.

### `POST /meal-plans/duplicate`
Duplicates an entire week's schedule to a future week.

---

## 4. Smart Shopping List

### `POST /shopping-list/generate`
Compiles a consolidated grocery list from planned meals within a date range.
- Integrates unit dimension normalization.
- Deducts available in-stock pantry items.
- Groups items by supermarket aisle (`PRODUCE`, `DAIRY`, `PANTRY_BAKING`, etc.).

### `PATCH /shopping-list/items/:id/check`
Toggles item checked status (synchronizes in real-time for household members).

### `GET /shopping-list/export`
Exports shopping list in CSV or plain text format.

---

## 5. Pantry & Shelf-Life Management

### `GET /pantry`
Lists current pantry items with optional `?filter=use_soon` (items expiring within 5 days).

### `POST /pantry`
Adds a pantry item with purchase date, shelf-life, and expiration date.

### `DELETE /pantry/:id`
Removes or consumes a pantry item.

---

## 6. Nutrition Estimation

### `GET /nutrition/recipe/:id`
Calculates estimated calories, protein, carbs, fat, and fiber for a recipe.
- If ingredients lack composition data, returns `status: "INCOMPLETE"` with list of missing items.
- Outputs explicit disclaimer: *"Algorithmic nutritional estimate based on open composition data."*
