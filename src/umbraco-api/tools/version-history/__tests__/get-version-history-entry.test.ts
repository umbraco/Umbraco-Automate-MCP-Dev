import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  VersionHistoryTestHelper,
} from "./setup.js";
import getVersionHistoryEntryTool from "../get/get-version-history-entry.js";
import updateAutomationTool from "../../automations/put/update-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsVerHist_entry";
const TEST_AUTOMATION_ALIAS = "_test_verhist_entry_automation";

describe("get-version-history-entry", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace VerHist Entry")
      .create();

    automation = await new AutomationBuilder()
      .withAlias(TEST_AUTOMATION_ALIAS)
      .withName("_Test VerHist Entry Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();
    await updateAutomationTool.handler(
      {
        automationId: automation.getId(),
        name: "_Test VerHist Entry Automation Renamed",
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

  it("should get a specific past version entry", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getVersionHistoryEntryTool.handler(
      { entityType: "Automation", entityId: automation.getId(), entityVersion: 1 },
      context,
    );

    expect(
      VersionHistoryTestHelper.normalize(createSnapshotResult(result, automation.getId())),
    ).toMatchSnapshot();
  });

  it("should return an error for a version number that does not exist", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getVersionHistoryEntryTool.handler(
      { entityType: "Automation", entityId: automation.getId(), entityVersion: 9999 },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
