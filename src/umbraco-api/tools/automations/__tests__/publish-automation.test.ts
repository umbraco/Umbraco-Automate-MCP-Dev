import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
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

const TEST_WORKSPACE_ALIAS = "_testWsAuto_publish";
const TEST_ALIAS = "_test_publish_automation";

describe("publish-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Publish")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Publish Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    // Publishing leaves an unpublish-able state; unpublish before deleting so the delete
    // itself isn't left depending on cascading a published automation.
    try {
      await unpublishAutomationTool.handler({ id: automation.getId() }, createMockRequestHandlerExtra());
    } catch {
      // Not published - nothing to unpublish.
    }
    await automation.delete();
  });

  it("should publish an automation that has a trigger and a step", async () => {
    const context = createMockRequestHandlerExtra();

    // A trigger + at least one step is required before publish-automation will succeed - a
    // step with no incoming connection runs directly off the trigger, so no explicit
    // connection is needed for the minimal valid graph.
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

    const result = await publishAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error when publishing an automation with no trigger or steps", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await publishAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBe(true);
  });
});
