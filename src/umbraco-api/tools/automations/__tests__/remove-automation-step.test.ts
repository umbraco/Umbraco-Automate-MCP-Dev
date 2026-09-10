import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  WorkspaceBuilder,
  TEST_ACTION_ALIAS,
  TEST_ACTION_SETTINGS,
  TEST_STEP_ALIAS,
} from "./setup.js";
import addAutomationStepTool from "../post/add-automation-step.js";
import removeAutomationStepTool from "../delete/remove-automation-step.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_removeStep";
const TEST_ALIAS = "_test_remove_step_automation";

describe("remove-automation-step", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Remove Step")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Remove Step Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();
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
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should remove the step from the automation's graph", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await removeAutomationStepTool.handler(
      { automationId: automation.getId(), step: TEST_STEP_ALIAS },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for an unknown step alias", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await removeAutomationStepTool.handler(
      { automationId: automation.getId(), step: "noSuchStep" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
