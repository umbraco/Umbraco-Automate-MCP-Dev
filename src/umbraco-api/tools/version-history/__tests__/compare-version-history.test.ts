import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  VersionHistoryTestHelper,
} from "./setup.js";
import compareVersionHistoryTool from "../get/compare-version-history.js";
import updateAutomationTool from "../../automations/put/update-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsVerHist_compare";
const TEST_AUTOMATION_ALIAS = "_test_verhist_compare_automation";

describe("compare-version-history", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace VerHist Compare")
      .create();

    automation = await new AutomationBuilder()
      .withAlias(TEST_AUTOMATION_ALIAS)
      .withName("_Test VerHist Compare Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();
    // Version 2: rename, so there is a real field-level diff against version 1 (creation).
    await updateAutomationTool.handler(
      {
        automationId: automation.getId(),
        name: "_Test VerHist Compare Automation Renamed",
        alias: undefined,
        description: undefined,
        groupId: undefined,
      },
      context,
    );
  });

  afterAll(async () => {
    await automation.delete();
    await workspace.delete();
    await AutomationTestHelper.cleanup(TEST_AUTOMATION_ALIAS);
  });

  it("should diff two versions of an entity", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await compareVersionHistoryTool.handler(
      {
        entityType: "Automation",
        entityId: automation.getId(),
        fromEntityVersion: 1,
        toEntityVersion: 2,
      },
      context,
    );

    expect(
      VersionHistoryTestHelper.normalize(createSnapshotResult(result, automation.getId())),
    ).toMatchSnapshot();
  });

  it("should return an error when a version number does not exist", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await compareVersionHistoryTool.handler(
      {
        entityType: "Automation",
        entityId: automation.getId(),
        fromEntityVersion: 1,
        toEntityVersion: 9999,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
