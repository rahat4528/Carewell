/**
 * Carewell Doctor Appointment System - Waitlist Redistribution Engine
 * 
 * Pipeline:
 * - WAITING -> OFFERED (with time-bounded expiry) -> CLAIMED (or EXPIRED).
 * - Guarantees only one active offer per freed slot at any given time.
 */

export interface WaitlistRecord {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  targetDate: string;
  status: "WAITING" | "OFFERED" | "CLAIMED" | "EXPIRED";
  offerExpiresAt: Date | null;
}

export function selectNextEligibleWaitlistCandidate(
  candidates: WaitlistRecord[],
  currentTime: Date
): WaitlistRecord | null {
  // First, check if there is an active unexpired offer
  const activeOffer = candidates.find(
    c => c.status === "OFFERED" && c.offerExpiresAt && c.offerExpiresAt > currentTime
  );
  if (activeOffer) {
    return null; // Slot already locked by an active offer
  }

  // Return oldest WAITING candidate
  const eligible = candidates.find(c => c.status === "WAITING");
  return eligible || null;
}

export function createWaitlistOffer(
  entry: WaitlistRecord,
  currentTime: Date,
  offerDurationHours: number = 2
): WaitlistRecord {
  const expiresAt = new Date(currentTime.getTime() + offerDurationHours * 3600 * 1000);
  return {
    ...entry,
    status: "OFFERED",
    offerExpiresAt: expiresAt
  };
}

export function sweepExpiredOffers(
  records: WaitlistRecord[],
  currentTime: Date
): WaitlistRecord[] {
  return records.map(r => {
    if (r.status === "OFFERED" && r.offerExpiresAt && r.offerExpiresAt <= currentTime) {
      return {
        ...r,
        status: "EXPIRED"
      };
    }
    return r;
  });
}
