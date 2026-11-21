# Carewell Meal Planner App - Test Suites

This directory describes the integration, calculation, and security test suites for the Meal Planner App.

## Test Matrix

| Test Suite | File Path | Focus Area |
|---|---|---|
| **E2E Cross-Cutting** | `backend/src/tests/e2e.test.ts` | Complete kitchen workflow: registration, household management, recipe creation with scalable/invariant items, dynamic serving scaling, weekly scheduling, smart shopping list with pantry deduction, missing nutrition handling, and SSRF rejection. |
| **Serving Scaling** | `backend/src/tests/scaling.test.ts` | Exact rational arithmetic for serving scaling ($S_{\text{target}} / S_{\text{base}}$), strictly preserving non-scalable items. |
| **Shopping Consolidation** | `backend/src/tests/shopping-consolidation.test.ts` | Unit dimension conversions (mass: g/kg; volume: ml/tbsp), dimension mismatch protection (keeping mass vs volume distinct without density), and pantry deduction. |
| **Nutritional Estimation** | `backend/src/tests/nutrition-incomplete.test.ts` | Macro calculation using composition data, handling missing data with explicit `INCOMPLETE` status and itemized uncalculated ingredients. |
| **SSRF Defense** | `backend/src/tests/ssrf-defense.test.ts` | RFC 1918 private subnets, loopback, and metadata endpoint blocking during recipe imports, plus Schema.org JSON-LD extraction. |
| **Pantry Expiry** | `backend/src/tests/pantry-expiry.test.ts` | Shelf-life categorization into expired, use-soon (within 5 days), and fresh items. |
| **Household Isolation** | `backend/src/tests/household-isolation.test.ts` | Cross-household isolation preventing unauthorized reads, mutations, or recipe assignments across distinct households. |

## Running Tests

From `02-meal-planner-app/backend`:
```bash
npm test
```
