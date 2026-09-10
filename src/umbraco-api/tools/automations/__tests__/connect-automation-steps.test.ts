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
  TEST_TRIGGER_ALIAS,
} from "./setup.js";
import addAutomationStepTool from "../post/add-automation-step.js";
import connectAutomationStepsTool from "../post/connect-automation-steps.js";
import setAutomationTriggerTool from "../put/set-automation-trigger.js";
import getAutomationTool from "../get/get-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_connectSteps";
const TEST_ALIAS = "_test_connect_steps_automation";

describe("connect-automation-steps", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Connect Steps")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Connect Steps Automation")
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
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should connect one step's output to another step's input", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await connectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: TEST_STEP_ALIAS,
        targetStep: TEST_STEP_ALIAS_2,
        outcome: undefined,
        conditions: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for an unknown target step alias", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await connectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: TEST_STEP_ALIAS,
        targetStep: "noSuchStep",
        outcome: undefined,
        conditions: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });

  it("should connect a step directly off the automation's trigger", async () => {
    const context = createMockRequestHandlerExtra();

    await setAutomationTriggerTool.handler(
      { automationId: automation.getId(), triggerAlias: TEST_TRIGGER_ALIAS, settings: undefined },
      context,
    );

    const result = await connectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: "trigger",
        targetStep: TEST_STEP_ALIAS,
        outcome: undefined,
        conditions: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should lay out steps top-down by distance from the trigger instead of stacking them", async () => {
    const context = createMockRequestHandlerExtra();

    await setAutomationTriggerTool.handler(
      { automationId: automation.getId(), triggerAlias: TEST_TRIGGER_ALIAS, settings: undefined },
      context,
    );
    await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "trigger", targetStep: TEST_STEP_ALIAS, outcome: undefined, conditions: undefined },
      context,
    );
    await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: TEST_STEP_ALIAS, targetStep: TEST_STEP_ALIAS_2, outcome: undefined, conditions: undefined },
      context,
    );

    const getResult = await getAutomationTool.handler({ id: automation.getId() }, context);
    const structured = getResult.structuredContent as {
      steps: { alias: string; position: { x: number; y: number } }[];
      canvasState: string | null;
    };

    const step1 = structured.steps.find((s) => s.alias === TEST_STEP_ALIAS)!;
    const step2 = structured.steps.find((s) => s.alias === TEST_STEP_ALIAS_2)!;

    // Two rows, one step per row, so each is centered (x=0) and further
    // down the canvas (increasing y) the deeper it is from the trigger -
    // never both stacked at the same position add-automation-step left them at.
    expect(step1.position).toEqual({ x: 0, y: 260 });
    expect(step2.position).toEqual({ x: 0, y: 520 });
    expect(step1.position.y).toBeLessThan(step2.position.y);

    const canvasState = JSON.parse(structured.canvasState!);
    expect(canvasState.triggerPosition).toEqual({ x: 0, y: 0 });
  });

  it("should return an error when connecting from the trigger before one is set", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await connectAutomationStepsTool.handler(
      {
        automationId: automation.getId(),
        sourceStep: "trigger",
        targetStep: TEST_STEP_ALIAS,
        outcome: undefined,
        conditions: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
