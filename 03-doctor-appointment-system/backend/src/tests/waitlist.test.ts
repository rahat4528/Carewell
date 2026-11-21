import {
  selectNextEligibleWaitlistCandidate,
  createWaitlistOffer,
  sweepExpiredOffers,
  WaitlistRecord
} from "../modules/waitlist/waitlist-engine";

describe("Waitlist Redistribution & Offer State Machine", () => {
  const currentTime = new Date("2026-11-23T10:00:00Z");

  const waitlist: WaitlistRecord[] = [
    {
      id: "w1",
      patientId: "p1",
      doctorId: "doc_1",
      clinicId: "c1",
      targetDate: "2026-11-25",
      status: "WAITING",
      offerExpiresAt: null
    },
    {
      id: "w2",
      patientId: "p2",
      doctorId: "doc_1",
      clinicId: "c1",
      targetDate: "2026-11-25",
      status: "WAITING",
      offerExpiresAt: null
    }
  ];

  test("selects oldest waiting candidate and creates time-bounded offer", () => {
    const candidate = selectNextEligibleWaitlistCandidate(waitlist, currentTime);
    expect(candidate).not.toBeNull();
    expect(candidate?.id).toBe("w1");

    const offered = createWaitlistOffer(candidate!, currentTime, 2);
    expect(offered.status).toBe("OFFERED");
    expect(offered.offerExpiresAt?.toISOString()).toBe("2026-11-23T12:00:00.000Z"); // +2h
  });

  test("prevents duplicate offers when an active offer is currently pending", () => {
    const listWithActiveOffer: WaitlistRecord[] = [
      {
        id: "w1",
        patientId: "p1",
        doctorId: "doc_1",
        clinicId: "c1",
        targetDate: "2026-11-25",
        status: "OFFERED",
        offerExpiresAt: new Date("2026-11-23T11:00:00Z") // unexpired at 10:00
      },
      {
        id: "w2",
        patientId: "p2",
        doctorId: "doc_1",
        clinicId: "c1",
        targetDate: "2026-11-25",
        status: "WAITING",
        offerExpiresAt: null
      }
    ];

    const nextCandidate = selectNextEligibleWaitlistCandidate(listWithActiveOffer, currentTime);
    expect(nextCandidate).toBeNull(); // Blocked by active offer
  });

  test("sweeps expired offers and marks them as EXPIRED", () => {
    const listWithStaleOffer: WaitlistRecord[] = [
      {
        id: "w1",
        patientId: "p1",
        doctorId: "doc_1",
        clinicId: "c1",
        targetDate: "2026-11-25",
        status: "OFFERED",
        offerExpiresAt: new Date("2026-11-23T09:00:00Z") // Expired 1 hour ago
      }
    ];

    const swept = sweepExpiredOffers(listWithStaleOffer, currentTime);
    expect(swept[0].status).toBe("EXPIRED");
  });
});
