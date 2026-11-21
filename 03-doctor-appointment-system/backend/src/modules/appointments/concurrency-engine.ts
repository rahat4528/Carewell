/**
 * Carewell Doctor Appointment System - Appointment Concurrency & Lifecycle Engine
 * 
 * Implements:
 * - Minimum notice cancellation policy evaluation (e.g. 24 hours).
 * - Video teleconsultation link visibility window (15 mins prior to 60 mins after).
 * - Status transition matrix validation.
 */

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED_BY_PATIENT", "CANCELLED_BY_DOCTOR"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED_BY_PATIENT", "CANCELLED_BY_DOCTOR", "RESCHEDULED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED_BY_PATIENT: [],
  CANCELLED_BY_DOCTOR: [],
  NO_SHOW: [],
  RESCHEDULED: []
};

export function canTransitionStatus(currentStatus: string, nextStatus: string): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Evaluates whether an appointment meets the minimum notice cancellation policy
 */
export function checkCancellationNotice(
  appointmentTime: Date,
  cancellationTime: Date,
  minNoticeHours: number = 24
): { isAllowed: boolean; hoursRemaining: number } {
  const diffMs = appointmentTime.getTime() - cancellationTime.getTime();
  const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  return {
    isAllowed: hoursRemaining >= minNoticeHours,
    hoursRemaining
  };
}

/**
 * Checks if a teleconsultation video URL is currently within its authorized visibility window
 */
export function isVideoLinkVisible(
  appointmentTime: Date,
  currentTime: Date,
  windowBeforeMinutes: number = 15,
  windowAfterMinutes: number = 60
): boolean {
  const startWindow = new Date(appointmentTime.getTime() - windowBeforeMinutes * 60 * 1000);
  const endWindow = new Date(appointmentTime.getTime() + windowAfterMinutes * 60 * 1000);

  return currentTime >= startWindow && currentTime <= endWindow;
}
