import {
  generateDaySlots,
  hasCrossClinicConflict,
  ScheduleBlock,
  GeneratedSlot
} from "../modules/scheduling/slot-generator";

describe("Doctor Scheduling & Cross-Clinic Conflict Engine", () => {
  test("generates discrete time slots according to duration and buffer", () => {
    const block: ScheduleBlock = {
      doctorId: "doc_1",
      clinicId: "clinic_A",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
      slotDurationMinutes: 30,
      bufferMinutes: 10
    };

    const slots = generateDaySlots("2026-11-23", block);
    // 09:00 - 09:30 (step to 09:40)
    // 09:40 - 10:10 (step to 10:20)
    // next would end at 10:50 > 10:30, so exactly 2 slots
    expect(slots).toHaveLength(2);
    expect(slots[0].startTimeUtc.toISOString()).toContain("09:00:00.000Z");
    expect(slots[0].endTimeUtc.toISOString()).toContain("09:30:00.000Z");
    expect(slots[1].startTimeUtc.toISOString()).toContain("09:40:00.000Z");
    expect(slots[1].endTimeUtc.toISOString()).toContain("10:10:00.000Z");
  });

  test("detects overlapping scheduling conflicts for the same doctor at another clinic", () => {
    const existingClinicASlots: GeneratedSlot[] = [
      {
        doctorId: "doc_cardiologist",
        clinicId: "clinic_Downtown",
        startTimeUtc: new Date("2026-11-23T14:00:00Z"),
        endTimeUtc: new Date("2026-11-23T14:45:00Z")
      }
    ];

    // Conflict candidate: Doctor at Midtown clinic from 14:30 to 15:15
    const conflictCandidate: GeneratedSlot = {
      doctorId: "doc_cardiologist",
      clinicId: "clinic_Midtown",
      startTimeUtc: new Date("2026-11-23T14:30:00Z"),
      endTimeUtc: new Date("2026-11-23T15:15:00Z")
    };

    expect(hasCrossClinicConflict(existingClinicASlots, conflictCandidate)).toBe(true);

    // Non-conflicting candidate: Doctor at Midtown clinic starting at 15:00 (after 14:45)
    const validCandidate: GeneratedSlot = {
      doctorId: "doc_cardiologist",
      clinicId: "clinic_Midtown",
      startTimeUtc: new Date("2026-11-23T15:00:00Z"),
      endTimeUtc: new Date("2026-11-23T15:45:00Z")
    };

    expect(hasCrossClinicConflict(existingClinicASlots, validCandidate)).toBe(false);
  });
});
