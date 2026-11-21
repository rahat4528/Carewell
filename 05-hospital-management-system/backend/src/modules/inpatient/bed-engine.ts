export interface RoomBillingResult {
  daysCharged: number;
  dailyRateCents: number;
  totalRoomChargesCents: number;
}

/**
 * Calculates inpatient room charges based on daily ward rate and admission duration.
 * Fractional days are rounded up to the nearest whole calendar day (minimum 1 day).
 */
export function calculateRoomCharges(
  admissionDate: Date,
  dischargeDate: Date,
  dailyRateCents: number
): RoomBillingResult {
  const diffMs = Math.max(0, dischargeDate.getTime() - admissionDate.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  // Minimum 1 day; charge additional day for every partial 24-hour block
  const daysCharged = Math.max(1, Math.ceil(diffHours / 24));
  const totalRoomChargesCents = daysCharged * dailyRateCents;

  return {
    daysCharged,
    dailyRateCents,
    totalRoomChargesCents
  };
}
