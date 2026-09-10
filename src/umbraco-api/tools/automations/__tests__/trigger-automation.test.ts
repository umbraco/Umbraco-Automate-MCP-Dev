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
import triggerAutomationTool from "../post/trigger-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_trigger";
const TEST_ALIAS = "_test_trigger_automation";

describe("trigger-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Trigger")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Trigger Automation")
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

  it("should start a new run of a published automation", async () => {
    // Contrary to this tool's own description ("does not require the automation to be
    // published"), the real API rejects triggering an unpublished automation with a 409
    // ("The automation must be published to be triggered.") - confirmed against the real
    // instance. So the happy path here publishes first.
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

    const result = await triggerAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error when the automation is not published", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await triggerAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBe(true);
  });
});
