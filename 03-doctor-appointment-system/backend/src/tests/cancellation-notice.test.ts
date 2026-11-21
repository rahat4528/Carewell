import { checkCancellationNotice, isVideoLinkVisible } from "../modules/appointments/concurrency-engine";

describe("Cancellation Notice Policy & Teleconsultation Visibility Engine", () => {
  describe("Cancellation Policy (Minimum 24h Notice)", () => {
    test("allows cancellation when requested 30 hours prior to appointment", () => {
      const apptTime = new Date("2026-11-25T14:00:00Z");
      const requestTime = new Date("2026-11-24T08:00:00Z"); // 30 hours before

      const notice = checkCancellationNotice(apptTime, requestTime, 24);
      expect(notice.isAllowed).toBe(true);
      expect(notice.hoursRemaining).toBe(30);
    });

    test("rejects cancellation when requested 8 hours prior to appointment (< 24h)", () => {
      const apptTime = new Date("2026-11-25T14:00:00Z");
      const requestTime = new Date("2026-11-25T06:00:00Z"); // 8 hours before

      const notice = checkCancellationNotice(apptTime, requestTime, 24);
      expect(notice.isAllowed).toBe(false);
      expect(notice.hoursRemaining).toBe(8);
    });
  });

  describe("Teleconsultation Video Link Window", () => {
    const apptTime = new Date("2026-11-25T14:00:00Z"); // 2:00 PM

    test("video link is visible 10 minutes prior to appointment (within 15 min window)", () => {
      const currentTime = new Date("2026-11-25T13:50:00Z"); // 1:50 PM
      expect(isVideoLinkVisible(apptTime, currentTime, 15, 60)).toBe(true);
    });

    test("video link is visible during consultation (e.g. 25 minutes after start)", () => {
      const currentTime = new Date("2026-11-25T14:25:00Z"); // 2:25 PM
      expect(isVideoLinkVisible(apptTime, currentTime, 15, 60)).toBe(true);
    });

    test("video link is hidden 2 hours before appointment", () => {
      const currentTime = new Date("2026-11-25T12:00:00Z"); // 12:00 PM
      expect(isVideoLinkVisible(apptTime, currentTime, 15, 60)).toBe(false);
    });

    test("video link is expired and hidden 90 minutes after appointment start (> 60 min window)", () => {
      const currentTime = new Date("2026-11-25T15:30:00Z"); // 3:30 PM
      expect(isVideoLinkVisible(apptTime, currentTime, 15, 60)).toBe(false);
    });
  });
});
