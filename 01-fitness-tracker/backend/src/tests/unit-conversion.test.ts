import {
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
  metersToMiles,
  milesToMeters,
  formatWeight,
  formatLength
} from "../modules/measurements/unit-engine";

describe("Canonical Unit Engine & Round-Trip Tests", () => {
  describe("Weight Conversions (kg <-> lbs)", () => {
    test("accurately converts kg to lbs", () => {
      expect(kgToLbs(100)).toBe(220.46);
      expect(kgToLbs(75)).toBe(165.35);
      expect(kgToLbs(0)).toBe(0);
    });

    test("accurately converts lbs to kg", () => {
      expect(lbsToKg(220.462)).toBe(100);
      expect(lbsToKg(0)).toBe(0);
    });

    test("guarantees round-trip mathematical integrity without drift", () => {
      const testWeightsKg = [50, 72.5, 84.3, 100, 120.75, 150];
      for (const originalKg of testWeightsKg) {
        const lbs = kgToLbs(originalKg);
        const backToKg = lbsToKg(lbs);
        // Round to 2 decimal places to check drift
        expect(Math.abs(backToKg - originalKg)).toBeLessThanOrEqual(0.01);
      }
    });

    test("throws error on negative weight values", () => {
      expect(() => kgToLbs(-5)).toThrow("Weight cannot be negative");
      expect(() => lbsToKg(-10)).toThrow("Weight cannot be negative");
    });
  });

  describe("Length Conversions (cm <-> in)", () => {
    test("accurately converts cm to inches", () => {
      expect(cmToInches(180)).toBe(70.87);
      expect(cmToInches(100)).toBe(39.37);
      expect(cmToInches(0)).toBe(0);
    });

    test("accurately converts inches to cm", () => {
      expect(inchesToCm(70.866)).toBe(180);
      expect(inchesToCm(0)).toBe(0);
    });

    test("guarantees round-trip length integrity without drift", () => {
      const testLengthsCm = [150, 165.5, 178, 190.25, 200];
      for (const originalCm of testLengthsCm) {
        const inches = cmToInches(originalCm);
        const backToCm = inchesToCm(inches);
        expect(Math.abs(backToCm - originalCm)).toBeLessThanOrEqual(0.01);
      }
    });

    test("throws error on negative length values", () => {
      expect(() => cmToInches(-1)).toThrow("Length cannot be negative");
      expect(() => inchesToCm(-1)).toThrow("Length cannot be negative");
    });
  });

  describe("Distance Conversions (m <-> miles)", () => {
    test("accurately converts meters to miles and back", () => {
      const meters = 5000; // 5k
      const miles = metersToMiles(meters);
      expect(miles).toBe(3.11);
      const backToMeters = milesToMeters(miles);
      expect(Math.abs(backToMeters - meters)).toBeLessThanOrEqual(10); // within 10 meters due to 2-decimal mile precision
    });
  });

  describe("Display Formatting with System Toggle", () => {
    test("formats weight for METRIC preference preserving canonical units", () => {
      const formatted = formatWeight(80.5, "METRIC");
      expect(formatted.value).toBe(80.5);
      expect(formatted.unit).toBe("kg");
      expect(formatted.canonicalKg).toBe(80.5);
    });

    test("formats weight for IMPERIAL preference with conversion", () => {
      const formatted = formatWeight(80.5, "IMPERIAL");
      expect(formatted.value).toBe(177.47);
      expect(formatted.unit).toBe("lbs");
      expect(formatted.canonicalKg).toBe(80.5);
    });

    test("formats length for METRIC and IMPERIAL", () => {
      const metricLen = formatLength(175, "METRIC");
      expect(metricLen.unit).toBe("cm");
      expect(metricLen.value).toBe(175);

      const imperialLen = formatLength(175, "IMPERIAL");
      expect(imperialLen.unit).toBe("in");
      expect(imperialLen.value).toBe(68.9);
    });
  });
});
