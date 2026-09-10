import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  TEST_ACTION_ALIAS,
  TEST_ACTION_SETTINGS,
  TEST_STEP_ALIAS,
  TEST_TRIGGER_ALIAS,
} from "./setup.js";
import addAutomationStepTool from "../post/add-automation-step.js";
import setAutomationTriggerTool from "../put/set-automation-trigger.js";
import publishAutomationTool from "../post/publish-automation.js";
import unpublishAutomationTool from "../post/unpublish-automation.js";
import triggerAutomationTool from "../post/trigger-automation.js";
import listAutomationRunsTool from "../get/list-automation-runs.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_listRuns";
const TEST_ALIAS = "_test_list_runs_automation";

describe("list-automation-runs", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto List Runs")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test List Runs Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    try {
      await unpublishAutomationTool.handler({ id: automation.getId() }, createMockRequestHandlerExtra());
    } catch {
      // Not published - nothing to unpublish.
    }
    await automation.delete();
  });

  it("should list the runs for an automation after triggering one", async () => {
    const context = createMockRequestHandlerExtra();

    await setAutomationTriggerTool.handler(
      { automationId: automation.getId(), triggerAlias: TEST_TRIGGER_ALIAS, settings: undefined },
      context,
    );
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias: TEST_ACTION_ALIAS,
        alias: TEST_STEP_ALIAS,
        name: "Delay Step",
        settings: TEST_ACTION_SETTINGS,
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      context,
    );
    await publishAutomationTool.handler({ id: automation.getId() }, context);
    await triggerAutomationTool.handler({ id: automation.getId() }, context);

    const result = await listAutomationRunsTool.handler(
      { id: automation.getId() },
      context,
    );

    expect(result.isError).toBeFalsy();
    const structured = result.structuredContent as { items: unknown[] };
    // The run's own status/timing is async and non-deterministic (this instance has no way
    // to force-await run completion from a test), so this only asserts that triggering
    // produced a run at all, rather than snapshotting its contents.
    expect(structured.items.length).toBeGreaterThan(0);
  });

  it("should return an error for a non-existent automation id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listAutomationRunsTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
