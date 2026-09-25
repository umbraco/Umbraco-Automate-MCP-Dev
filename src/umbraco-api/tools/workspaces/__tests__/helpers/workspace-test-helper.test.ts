import {
  setupTestEnvironment,
  WorkspaceBuilder,
  WorkspaceTestHelper,
} from "../setup.js";

const TEST_NAME = "_Test Helper Workspace";
const TEST_ALIAS = "_testHelperWorkspace";
const OTHER_ALIAS = `${TEST_ALIAS}Other`;

describe("WorkspaceTestHelper", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder | undefined;

  afterEach(async () => {
    // Always clean up created workspaces to prevent conflicts with other test files
    if (builder) await builder.delete();
    builder = undefined;
    await WorkspaceTestHelper.cleanup(TEST_ALIAS);
  });

  it("should find a freshly created workspace by alias", async () => {
    builder = await new WorkspaceBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .create();

    const found = await WorkspaceTestHelper.findByAlias(TEST_ALIAS);

    expect(found).toBeDefined();
    expect(found?.id).toBe(builder.getId());
    expect(found?.name).toBe(TEST_NAME);
  });

  it("should return undefined for an alias that doesn't exist", async () => {
    const found = await WorkspaceTestHelper.findByAlias("_testHelperNonexistentWorkspace");

    expect(found).toBeUndefined();
  });

  it("should delete every workspace whose alias starts with the prefix", async () => {
    await new WorkspaceBuilder().withAlias(TEST_ALIAS).withName(TEST_NAME).create();
    await new WorkspaceBuilder()
      .withAlias(OTHER_ALIAS)
      .withName(`${TEST_NAME} Other`)
      .create();

    await WorkspaceTestHelper.cleanup(TEST_ALIAS);

    expect(await WorkspaceTestHelper.findByAlias(TEST_ALIAS)).toBeUndefined();
    expect(await WorkspaceTestHelper.findByAlias(OTHER_ALIAS)).toBeUndefined();
  });

  describe("normalizeIds", () => {
    it("should blank ids and dates, recursively", () => {
      const input = {
        id: "3781345e-515f-4001-b646-4dae16e3e8a6",
        name: "Real name",
        dateCreated: "2026-09-23T10:00:00Z",
        dateModified: "2026-09-23T11:00:00Z",
        groups: [
          {
            id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            workspaceId: "3781345e-515f-4001-b646-4dae16e3e8a6",
            parentId: "1f3ae040-2913-4918-9d1f-08e91a6000ae",
            name: "Group",
          },
        ],
      };

      expect(WorkspaceTestHelper.normalizeIds(input)).toEqual({
        id: "00000000-0000-0000-0000-000000000000",
        name: "Real name",
        dateCreated: "NORMALIZED_DATE",
        dateModified: "NORMALIZED_DATE",
        groups: [
          {
            id: "00000000-0000-0000-0000-000000000000",
            workspaceId: "00000000-0000-0000-0000-000000000000",
            parentId: "00000000-0000-0000-0000-000000000000",
            name: "Group",
          },
        ],
      });
    });

    it("should leave objects without ids untouched", () => {
      const input = { name: "Real name", alias: "realAlias" };

      expect(WorkspaceTestHelper.normalizeIds(input)).toEqual(input);
    });

    it("should leave non-object input untouched", () => {
      expect(WorkspaceTestHelper.normalizeIds("plain")).toBe("plain");
      expect(WorkspaceTestHelper.normalizeIds(null)).toBeNull();
    });
  });
});
