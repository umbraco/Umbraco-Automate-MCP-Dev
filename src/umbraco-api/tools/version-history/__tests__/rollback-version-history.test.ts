import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "./setup.js";
import rollbackVersionHistoryTool from "../post/rollback-version-history.js";
import updateAutomationTool from "../../automations/put/update-automation.js";
import getAutomationTool from "../../automations/get/get-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsVerHist_rollback";
const TEST_AUTOMATION_ALIAS = "_test_verhist_rollback_automation";
const ORIGINAL_NAME = "_Test VerHist Rollback Automation";
const RENAMED_NAME = "_Test VerHist Rollback Automation Renamed";

describe("rollback-version-history", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace VerHist Rollback")
      .create();

    automation = await new AutomationBuilder()
      .withAlias(TEST_AUTOMATION_ALIAS)
      .withName(ORIGINAL_NAME)
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();
    // Version 2: rename away from the original name, so rolling back to version 1 is
    // observable via get-automation afterwards.
    await updateAutomationTool.handler(
      {
        automationId: automation.getId(),
        name: RENAMED_NAME,
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

  it("should roll the entity back to a prior version", async () => {
    const context = createMockRequestHandlerExtra();

    // Sanity check: current state is the renamed version before rollback.
    const before = await getAutomationTool.handler({ id: automation.getId() }, context);
    expect(createSnapshotResult(before, automation.getId())).toMatchObject({
      structuredContent: expect.objectContaining({ name: RENAMED_NAME }),
    });

    const result = await rollbackVersionHistoryTool.handler(
      { entityType: "Automation", entityId: automation.getId(), entityVersion: 1 },
      context,
    );

    expect(result.isError).toBeFalsy();

    // Re-verify with get-automation that the rollback actually took effect.
    const after = await getAutomationTool.handler({ id: automation.getId() }, context);
    expect(createSnapshotResult(after, automation.getId())).toMatchObject({
      structuredContent: expect.objectContaining({ name: ORIGINAL_NAME }),
    });
  });

  it("should return an error for a version number that does not exist", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await rollbackVersionHistoryTool.handler(
      { entityType: "Automation", entityId: automation.getId(), entityVersion: 9999 },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
