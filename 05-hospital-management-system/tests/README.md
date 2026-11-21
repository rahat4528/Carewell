# Hospital Management System: Test Suite

Automated verification suite validating enterprise EHR, bed management concurrency, signed note immutability, laboratory 4-eyes review, ReBAC access controls, and emergency break-glass protocols.

## Test Matrix

1. **Bed Allocation & Inter-Ward Transfer Concurrency (`bed-concurrency.test.ts`)**:
   - Concurrency race test where two admission requests race for the final available bed in the ICU.
   - Proves exactly one admission succeeds and the second is safely rejected with 409 Conflict.
   - Proves atomic bed transfers update source bed to `CLEANING` and target bed to `OCCUPIED`.

2. **Vital Signs Plausibility Engine (`vitals-plausibility.test.ts`)**:
   - Validates acceptance of normal physiological values.
   - Tests bounds checking for Heart Rate, Blood Pressure, Respiratory Rate, Temperature, and SpO2.
   - Rejects implausible data (e.g. Heart Rate 600 bpm, SpO2 120%, Temp 20°C).

3. **Signed Note Immutability & Addenda (`notes-immutability.test.ts`)**:
   - Verifies that draft notes can be edited by the authoring clinician.
   - Verifies that signing locks the note permanently; subsequent update/delete attempts return 403 Forbidden.
   - Verifies that amendments must be authored as linked addenda referencing the parent note.

4. **Laboratory 4-Eyes Verification Workflow (`lab-workflow.test.ts`)**:
   - Verifies lab tech result entry transitions order to `RESULT_PENDING_VERIFICATION`.
   - Proves that results are masked/shielded from non-pathologist chart readers until verified.
   - Pathologist verification releases results to general chart view.

5. **ReBAC & Emergency Break-Glass Override (`rebac-breakglass.test.ts`)**:
   - Verifies that unaffiliated clinicians attempting to access chart receive 403 Forbidden.
   - Verifies that submitting an emergency break-glass override with valid justification reason grants chart access and produces an immutable `EMERGENCY_BREAK_GLASS` audit record.

6. **Comprehensive End-to-End Hospital Operations (`e2e.test.ts`)**:
   - Full patient journey: Registration -> Luhn MRN -> Inpatient Admission -> Bed Allocation -> Vitals Logging -> Lab Order -> Dual Verification -> Attending SOAP Note & Digital Signature -> Discharge & Room Billing.

## Running Tests

```bash
cd backend
npm test
```
