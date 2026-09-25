import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  WorkspaceBuilder,
  TEST_ACTION_ALIAS,
  TEST_ACTION_SETTINGS,
  TEST_STEP_ALIAS,
  TEST_STEP_ALIAS_2,
} from "./setup.js";
import addAutomationStepTool from "../post/add-automation-step.js";
import connectAutomationStepsTool from "../post/connect-automation-steps.js";
import disconnectAutomationStepsTool from "../delete/disconnect-automation-steps.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_disconnectSteps";
const TEST_ALIAS = "_test_disconnect_steps_automation";

describe("disconnect-automation-steps", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Disconnect Steps")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Disconnect Steps Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();
    for (const alias of [TEST_STEP_ALIAS, TEST_STEP_ALIAS_2]) {
      await addAutomationStepTool.handler(
        {
          automationId: automation.getId(),
          actionAlias: TEST_ACTION_ALIAS,
          alias,
          name: `Delay Step (${alias})`,
          settings: TEST_ACTION_SETTINGS,
          inputMappings: undefined,
          errorBehavior: undefined,
          retryInterval: undefined,
          maxRetries: undefined,
        },
        context,
      );
    }
    await connectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: TEST_STEP_ALIAS,
        targetStep: TEST_STEP_ALIAS_2,
        outcome: undefined,
        conditions: undefined,
      },
      context,
    );
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should remove the connection between two steps", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await disconnectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: TEST_STEP_ALIAS,
        targetStep: TEST_STEP_ALIAS_2,
        outcome: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should remove a branch connection by outcome regardless of casing", async () => {
    const context = createMockRequestHandlerExtra();
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias: "umbracoAutomate.if",
        alias: "check",
        name: "check",
        settings: { conditions: { groups: [{ conditions: [{ leftOperand: "x", operator: "Equals", rightOperand: "x" }] }] } },
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      context,
    );
    await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "check", targetStep: TEST_STEP_ALIAS, outcome: "true", conditions: undefined },
      context,
    );

    const result = await disconnectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "check", targetStep: TEST_STEP_ALIAS, outcome: "TRUE" },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect((result.structuredContent as { removedCount: number }).removedCount).toBe(1);
  });

  it("should return an error for an unknown target step alias", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await disconnectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: TEST_STEP_ALIAS,
        targetStep: "noSuchStep",
        outcome: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
