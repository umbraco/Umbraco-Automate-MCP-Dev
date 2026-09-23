import { setupTestEnvironment, VersionHistoryTestHelper } from "../setup.js";

describe("VersionHistoryTestHelper", () => {
  setupTestEnvironment();

  describe("normalize", () => {
    it("should blank ids and dateCreated, recursively", () => {
      const input = {
        total: 2,
        items: [
          {
            id: "3781345e-515f-4001-b646-4dae16e3e8a6",
            entityId: "1f3ae040-2913-4918-9d1f-08e91a6000ae",
            entityType: "Automation",
            entityVersion: 1,
            createdByUserId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            dateCreated: "2026-09-23T10:00:00Z",
          },
          {
            id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            entityId: "1f3ae040-2913-4918-9d1f-08e91a6000ae",
            entityType: "Automation",
            entityVersion: 2,
            dateCreated: "2026-09-23T11:00:00Z",
          },
        ],
      };

      expect(VersionHistoryTestHelper.normalize(input)).toEqual({
        total: 2,
        items: [
          {
            id: "00000000-0000-0000-0000-000000000000",
            entityId: "00000000-0000-0000-0000-000000000000",
            entityType: "Automation",
            entityVersion: 1,
            createdByUserId: "00000000-0000-0000-0000-000000000000",
            dateCreated: "NORMALIZED_DATE",
          },
          {
            id: "00000000-0000-0000-0000-000000000000",
            entityId: "00000000-0000-0000-0000-000000000000",
            entityType: "Automation",
            entityVersion: 2,
            dateCreated: "NORMALIZED_DATE",
          },
        ],
      });
    });

    it("should leave objects without ids untouched", () => {
      const input = { entityType: "Automation", entityVersion: 3 };

      expect(VersionHistoryTestHelper.normalize(input)).toEqual(input);
    });

    it("should leave non-object input untouched", () => {
      expect(VersionHistoryTestHelper.normalize("plain")).toBe("plain");
      expect(VersionHistoryTestHelper.normalize(null)).toBeNull();
    });
  });
});
