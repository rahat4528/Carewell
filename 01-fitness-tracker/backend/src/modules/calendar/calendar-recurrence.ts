/**
 * Carewell Fitness Tracker - Calendar Recurrence & Scheduling Engine
 * 
 * Handles:
 * - Generation of recurring calendar workout schedules.
 * - Detection of missed sessions based on date thresholds.
 * - Transitions: SCHEDULED -> IN_PROGRESS -> COMPLETED, or past due -> MISSED.
 */

export interface ScheduledWorkoutItem {
  id: string;
  planId: string;
  scheduledDate: string; // YYYY-MM-DD
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "MISSED" | "SKIPPED";
  recurrence: "NONE" | "WEEKLY";
}

/**
 * Generates dates for weekly recurring workouts up to N weeks ahead
 */
export function generateWeeklyRecurrence(
  startDateStr: string,
  weeksAhead: number = 4
): string[] {
  const dates: string[] = [];
  const start = new Date(startDateStr);

  for (let i = 0; i <= weeksAhead; i++) {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + (i * 7));
    dates.push(nextDate.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Evaluates whether scheduled workouts should be flagged as MISSED
 * If scheduledDate < todayDate and status === 'SCHEDULED', transitions to 'MISSED'
 */
export function evaluateScheduledStatus(
  scheduledWorkouts: ScheduledWorkoutItem[],
  currentDateStr: string
): ScheduledWorkoutItem[] {
  return scheduledWorkouts.map(item => {
    if (item.status === "SCHEDULED" && item.scheduledDate < currentDateStr) {
      return {
        ...item,
        status: "MISSED"
      };
    }
    return item;
  });
}
