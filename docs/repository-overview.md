# Carewell: Healthcare & Health Technology Suite

## Repository Overview

Carewell is an engineering collection of **five independent, standalone, production-grade healthcare and wellness applications**. Built with high architectural fidelity, modern web technologies, strict data protection standards, and zero shared runtime databases, Carewell exemplifies specialized system design across distinct healthcare subdomains.

---

## The 5 Independent Applications

1. **Fitness Tracker (`01-fitness-tracker`)**
   - **Focus**: Personal fitness tracking, exercise catalogs, progressive overload tracking, workout execution with rest timers, body metrics, and estimated energy expenditure.
   - **Key Principle**: Stored in canonical metric units with exact precision; distinguishes measured data from algorithmic estimates.

2. **Meal Planner App (`02-meal-planner-app`)**
   - **Focus**: Recipe cataloging, weekly meal scheduling, serving scaling, aisle-categorized grocery lists with pantry subtraction, and nutritional estimations.
   - **Key Principle**: Nutrition figures are transparently labeled as estimates with source tracking; strict distinction between volumetric and mass units.

3. **Doctor Appointment System (`03-doctor-appointment-system`)**
   - **Focus**: Clinic discovery, doctor profile and specialty filtering, timezone-aware schedule slots, double-booking prevention, atomic rescheduling, and appointment lifecycle tracking.
   - **Key Principle**: Atomic slot management; zero cross-clinic schedule conflicts; strict separation of clinical notes from administrative views.

4. **Pharmacy Management System (`04-pharmacy-management-system`)**
   - **Focus**: Medicine catalog, batch and expiry tracking, First-Expired-First-Out (FEFO) dispensing, Point-of-Sale (POS) billing, supplier purchasing, and controlled-medicine dispensing logs.
   - **Key Principle**: Non-negative inventory invariants enforced via database transactions; append-only inventory movement ledger.

5. **Hospital Management System (`05-hospital-management-system`)**
   - **Focus**: Institutional healthcare operations including patient administration (MRN generation), bed and ward allocation, clinical consultations, allergy alerts, nursing vitals, lab orders with four-eyes verification, and billing.
   - **Key Principle**: Relationship-based access control, tamper-evident audit logging, and locked signed clinical notes.

---

## Architectural Principles

- **Zero Shared Runtime Databases**: Each application operates with its own dedicated PostgreSQL database, Prisma schema, Redis instance, and storage buckets.
- **Isolated Deployments**: Any application can be booted, tested, scaled, or decommissioned without impacting any other application.
- **Health Data Privacy & Security**: Robust role-based and relationship-based access controls, field-level encryption for sensitive clinical attributes, tamper-evident audit logs, and minimal notification payloads.
- **No Autonomous Clinical Decision-Making**: None of the applications formulate diagnostic conclusions, calculate drug dosages, or provide clinical decision support. All clinical judgments remain in the hands of authorized human practitioners.
- **Original Architecture & Code**: Every component, schema, API endpoint, UI view, and test suite is designed and authored from first principles.
