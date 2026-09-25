import {
  setupTestEnvironment,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "../setup.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_helper";
const TEST_NAME = "_Test Helper Automation";
const TEST_ALIAS = "_test_helper_automation";
const OTHER_ALIAS = `${TEST_ALIAS}_other`;

describe("AutomationTestHelper", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let builder: AutomationBuilder | undefined;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Helper")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    // Always clean up created automations to prevent conflicts with other test files
    if (builder) await builder.delete();
    builder = undefined;
    await AutomationTestHelper.cleanup(TEST_ALIAS);
  });

  it("should find a freshly created automation by alias", async () => {
    builder = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .withWorkspaceId(workspace.getId())
      .create();

    const found = await AutomationTestHelper.findByAlias(TEST_ALIAS);

    expect(found).toBeDefined();
    expect(found?.id).toBe(builder.getId());
    expect(found?.name).toBe(TEST_NAME);
  });

  it("should return undefined for an alias that doesn't exist", async () => {
    const found = await AutomationTestHelper.findByAlias("_test_helper_nonexistent_automation");

    expect(found).toBeUndefined();
  });

  it("should delete every automation whose alias starts with the prefix", async () => {
    await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .withWorkspaceId(workspace.getId())
      .create();
    await new AutomationBuilder()
      .withAlias(OTHER_ALIAS)
      .withName(`${TEST_NAME} Other`)
      .withWorkspaceId(workspace.getId())
      .create();

    await AutomationTestHelper.cleanup(TEST_ALIAS);

    expect(await AutomationTestHelper.findByAlias(TEST_ALIAS)).toBeUndefined();
    expect(await AutomationTestHelper.findByAlias(OTHER_ALIAS)).toBeUndefined();
  });

  describe("normalizeIds", () => {
    it("should blank every id field and date, recursively", () => {
      const input = {
        id: "3781345e-515f-4001-b646-4dae16e3e8a6",
        workspaceId: "1f3ae040-2913-4918-9d1f-08e91a6000ae",
        groupId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        alias: "realAlias",
        dateCreated: "2026-09-23T10:00:00Z",
        dateModified: "2026-09-23T11:00:00Z",
        exportedAt: "2026-09-23T12:00:00Z",
        steps: [
          {
            stepId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            connectionId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          },
        ],
        connections: [
          {
            sourceStepId: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            targetStepId: "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          },
        ],
        run: { automationId: "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
      };

      expect(AutomationTestHelper.normalizeIds(input)).toEqual({
        id: "00000000-0000-0000-0000-000000000000",
        workspaceId: "00000000-0000-0000-0000-000000000000",
        groupId: "00000000-0000-0000-0000-000000000000",
        alias: "realAlias",
        dateCreated: "NORMALIZED_DATE",
        dateModified: "NORMALIZED_DATE",
        exportedAt: "NORMALIZED_DATE",
        steps: [
          {
            stepId: "00000000-0000-0000-0000-000000000000",
            connectionId: "00000000-0000-0000-0000-000000000000",
          },
        ],
        connections: [
          {
            sourceStepId: "00000000-0000-0000-0000-000000000000",
            targetStepId: "00000000-0000-0000-0000-000000000000",
          },
        ],
        run: { automationId: "00000000-0000-0000-0000-000000000000" },
      });
    });

    it("should replace UUIDs embedded inside strings", () => {
      expect(
        AutomationTestHelper.normalizeIds(
          "An automation with ID '3781345e-515f-4001-b646-4dae16e3e8a6' already exists.",
        ),
      ).toBe("An automation with ID '00000000-0000-0000-0000-000000000000' already exists.");

      expect(
        AutomationTestHelper.normalizeIds({
          url: "https://example.com/automate/webhook/3781345E-515F-4001-B646-4DAE16E3E8A6",
        }),
      ).toEqual({
        url: "https://example.com/automate/webhook/00000000-0000-0000-0000-000000000000",
      });
    });

    it("should leave values without ids untouched", () => {
      const input = { alias: "realAlias", enabled: true, count: 3 };

      expect(AutomationTestHelper.normalizeIds(input)).toEqual(input);
      expect(AutomationTestHelper.normalizeIds(null)).toBeNull();
    });
  });
});
