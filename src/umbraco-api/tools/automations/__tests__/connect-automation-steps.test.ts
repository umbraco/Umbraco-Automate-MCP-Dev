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

    // A straight chain under the trigger: action nodes render 282px wide, so centring them
    // on the trigger's centre (x=0) puts their left edge at -141, and each sits a fixed
    // gap below the one above (trigger 65px tall, action 115px, gap 72px).
    expect(step1.position).toEqual({ x: -141, y: 137 });
    expect(step2.position).toEqual({ x: -141, y: 324 });

    // The trigger node is centred on x=0 too, so the edge into the first step is straight.
    const canvasState = JSON.parse(structured.canvasState!);
    expect(canvasState.triggerPosition.y).toBe(0);
    expect(canvasState.triggerPosition.x).toBeLessThanOrEqual(-111);
    expect(canvasState.triggerPosition.x).toBeGreaterThanOrEqual(-141);
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
  async function addControlFlowStep(actionAlias: string, alias: string, settings: Record<string, unknown>) {
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias,
        alias,
        name: alias,
        settings,
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      createMockRequestHandlerExtra(),
    );
  }

  async function connectionsFrom(stepAlias: string) {
    const saved = await getAutomationTool.handler({ id: automation.getId() }, createMockRequestHandlerExtra());
    const { steps, connections } = saved.structuredContent as {
      steps: { id: string; alias: string }[];
      connections: { sourceStepId: string; sourceHandle: string | null; outcome: string | null }[];
    };
    const sourceId = steps.find((s) => s.alias === stepAlias)?.id;
    return connections
      .filter((c) => c.sourceStepId === sourceId)
      .map(({ sourceHandle, outcome }) => ({ sourceHandle, outcome }));
  }

  const alwaysTrue = { groups: [{ conditions: [{ leftOperand: "x", operator: "Equals", rightOperand: "x" }] }] };

  it("should save an If outcome in the exact lowercase form the runtime matches, whatever casing is passed", async () => {
    const context = createMockRequestHandlerExtra();
    await addControlFlowStep("umbracoAutomate.if", "check", { conditions: alwaysTrue });

    const result = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "check", targetStep: TEST_STEP_ALIAS, outcome: "True", conditions: undefined },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(await connectionsFrom("check")).toEqual([{ sourceHandle: "true", outcome: "true" }]);
  });

  it("should route a container's exit through the done handle, accepting 'after' for it", async () => {
    const context = createMockRequestHandlerExtra();
    await addControlFlowStep("umbracoAutomate.while", "repeat", { conditions: alwaysTrue, maxIterations: 2 });

    const body = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "repeat", targetStep: TEST_STEP_ALIAS, outcome: "loop", conditions: undefined },
      context,
    );
    const done = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "repeat", targetStep: TEST_STEP_ALIAS_2, outcome: "after", conditions: undefined },
      context,
    );

    expect(body.isError).toBeFalsy();
    expect(done.isError).toBeFalsy();
    expect(await connectionsFrom("repeat")).toEqual([
      { sourceHandle: "body", outcome: "body" },
      { sourceHandle: "done", outcome: "done" },
    ]);
  });

  it("should return an error when a container's done output is already connected", async () => {
    const context = createMockRequestHandlerExtra();
    await addControlFlowStep("umbracoAutomate.while", "repeat", { conditions: alwaysTrue, maxIterations: 2 });
    await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "repeat", targetStep: TEST_STEP_ALIAS, outcome: "done", conditions: undefined },
      context,
    );

    const result = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "repeat", targetStep: TEST_STEP_ALIAS_2, outcome: "done", conditions: undefined },
      context,
    );

    expect(result.isError).toBe(true);
  });

  it("should return an error for an outcome the source step does not have", async () => {
    const context = createMockRequestHandlerExtra();
    await addControlFlowStep("umbracoAutomate.switch", "route", {
      cases: [{ name: "enterprise", conditions: alwaysTrue }],
    });

    const result = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "route", targetStep: TEST_STEP_ALIAS, outcome: "developer", conditions: undefined },
      context,
    );

    expect(result.isError).toBe(true);
  });

  it("should return an error when connecting from a branching step without an outcome", async () => {
    const context = createMockRequestHandlerExtra();
    await addControlFlowStep("umbracoAutomate.if", "check", { conditions: alwaysTrue });

    const result = await connectAutomationStepsTool.handler(
      { automationId: automation.getId(), sourceStep: "check", targetStep: TEST_STEP_ALIAS, outcome: undefined, conditions: undefined },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
