import { setupTestEnvironment, RunTestHelper } from "../setup.js";

describe("RunTestHelper", () => {
  setupTestEnvironment();

  describe("normalizeIds", () => {
    it("should blank ids, dates and duration, recursively", () => {
      const input = {
        id: "3781345e-515f-4001-b646-4dae16e3e8a6",
        automationId: "1f3ae040-2913-4918-9d1f-08e91a6000ae",
        correlationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        status: "Completed",
        startedUtc: "2026-09-23T10:00:00Z",
        completedUtc: "2026-09-23T10:00:05Z",
        durationMs: 5123,
        stepRuns: [
          {
            id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            stepId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            startedUtc: "2026-09-23T10:00:01Z",
            durationMs: 42,
          },
        ],
      };

      expect(RunTestHelper.normalizeIds(input)).toEqual({
        id: "00000000-0000-0000-0000-000000000000",
        automationId: "00000000-0000-0000-0000-000000000000",
        correlationId: "00000000-0000-0000-0000-000000000000",
        status: "Completed",
        startedUtc: "NORMALIZED_DATE",
        completedUtc: "NORMALIZED_DATE",
        durationMs: 0,
        stepRuns: [
          {
            id: "00000000-0000-0000-0000-000000000000",
            stepId: "00000000-0000-0000-0000-000000000000",
            startedUtc: "NORMALIZED_DATE",
            durationMs: 0,
          },
        ],
      });
    });

    it("should leave a null completedUtc and a zero duration as they are", () => {
      const input = { status: "Running", completedUtc: null, durationMs: 0 };

      expect(RunTestHelper.normalizeIds(input)).toEqual(input);
    });

    it("should replace UUIDs embedded inside strings", () => {
      expect(
        RunTestHelper.normalizeIds("Run '3781345e-515f-4001-b646-4dae16e3e8a6' was not found."),
      ).toBe("Run '00000000-0000-0000-0000-000000000000' was not found.");
    });

    it("should leave non-object input untouched", () => {
      expect(RunTestHelper.normalizeIds(42)).toBe(42);
      expect(RunTestHelper.normalizeIds(null)).toBeNull();
    });
  });
});
