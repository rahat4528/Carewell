import {
  generateWeeklyRecurrence,
  evaluateScheduledStatus,
  ScheduledWorkoutItem
} from "../modules/calendar/calendar-recurrence";

describe("Calendar Recurrence & Scheduling Engine", () => {
  test("generates weekly recurring dates accurately", () => {
    const dates = generateWeeklyRecurrence("2026-11-01", 3);
    expect(dates).toEqual([
      "2026-11-01",
      "2026-11-08",
      "2026-11-15",
      "2026-11-22"
    ]);
  });

  test("transitions overdue uncompleted scheduled workouts to MISSED state", () => {
    const workouts: ScheduledWorkoutItem[] = [
      {
        id: "w1",
        planId: "p1",
        scheduledDate: "2026-11-10",
        status: "SCHEDULED",
        recurrence: "WEEKLY"
      },
      {
        id: "w2",
        planId: "p1",
        scheduledDate: "2026-11-25",
        status: "SCHEDULED",
        recurrence: "WEEKLY"
      },
      {
        id: "w3",
        planId: "p1",
        scheduledDate: "2026-11-05",
        status: "COMPLETED",
        recurrence: "WEEKLY"
      }
    ];

    const todayDate = "2026-11-20";
    const evaluated = evaluateScheduledStatus(workouts, todayDate);

    // w1 was scheduled for Nov 10, today is Nov 20 -> should be MISSED
    expect(evaluated.find(w => w.id === "w1")?.status).toBe("MISSED");
    // w2 is scheduled for Nov 25 -> remains SCHEDULED
    expect(evaluated.find(w => w.id === "w2")?.status).toBe("SCHEDULED");
    // w3 was COMPLETED -> remains COMPLETED
    expect(evaluated.find(w => w.id === "w3")?.status).toBe("COMPLETED");
  });
});
