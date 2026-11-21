/**
 * Carewell Doctor Appointment System - Schedule & Slot Generation Engine
 * 
 * Responsibilities:
 * - Generates discrete time slots from recurring weekly template.
 * - Detects and prevents cross-clinic scheduling conflicts for multi-facility practitioners.
 */

export interface ScheduleBlock {
  doctorId: string;
  clinicId: string;
  dayOfWeek: number; // 1 (Mon) - 7 (Sun)
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number;
  bufferMinutes: number;
}

export interface GeneratedSlot {
  doctorId: string;
  clinicId: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Derives discrete slot time ranges for a specific date given a schedule block
 */
export function generateDaySlots(
  dateStr: string, // YYYY-MM-DD
  block: ScheduleBlock
): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  const startMins = parseTimeToMinutes(block.startTime);
  const endMins = parseTimeToMinutes(block.endTime);
  const step = block.slotDurationMinutes + block.bufferMinutes;

  let current = startMins;
  while (current + block.slotDurationMinutes <= endMins) {
    const slotStartStr = `${dateStr}T${minutesToTime(current)}:00Z`;
    const slotEndStr = `${dateStr}T${minutesToTime(current + block.slotDurationMinutes)}:00Z`;

    slots.push({
      doctorId: block.doctorId,
      clinicId: block.clinicId,
      startTimeUtc: new Date(slotStartStr),
      endTimeUtc: new Date(slotEndStr)
    });

    current += step;
  }

  return slots;
}

/**
 * Checks for cross-clinic scheduling collisions for the same doctor across multiple facilities
 */
export function hasCrossClinicConflict(
  existingSlots: GeneratedSlot[],
  candidateSlot: GeneratedSlot
): boolean {
  for (const existing of existingSlots) {
    if (existing.doctorId === candidateSlot.doctorId) {
      // If time overlaps
      const isOverlap =
        candidateSlot.startTimeUtc < existing.endTimeUtc &&
        candidateSlot.endTimeUtc > existing.startTimeUtc;

      if (isOverlap) {
        return true; // Overlap exists!
      }
    }
  }
  return false;
}
