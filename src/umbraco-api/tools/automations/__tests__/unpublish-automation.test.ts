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

const TEST_WORKSPACE_ALIAS = "_testWsAuto_unpublish";
const TEST_ALIAS = "_test_unpublish_automation";

describe("unpublish-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Unpublish")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Unpublish Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should unpublish a published automation", async () => {
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

    const result = await unpublishAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error when the automation is not currently published", async () => {
    const context = createMockRequestHandlerExtra();

    // Fresh draft automation from beforeEach - never published.
    const result = await unpublishAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBe(true);
  });
});
