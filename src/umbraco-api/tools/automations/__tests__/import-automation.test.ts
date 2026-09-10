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
import exportAutomationTool from "../get/export-automation.js";
import importAutomationTool from "../post/import-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_import";
const TEST_ALIAS = "_test_import_automation";

describe("import-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Import")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    await AutomationTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create an automation in a workspace from a real exported definition", async () => {
    // Despite this tool's own description ("Always creates a new automation with a new id,
    // even if the export's original id already exists"), the real API actually reuses the
    // exported automation's original id and rejects the import with a 400/409 if an
    // automation with that id still exists anywhere - confirmed against the real instance.
    // So the natural way to reach a genuine success here is: build a source automation,
    // export it, delete the source, then import the exact exported blob back in.
    const context = createMockRequestHandlerExtra();
    const source = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Import Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    await setAutomationTriggerTool.handler(
      { automationId: source.getId(), triggerAlias: TEST_TRIGGER_ALIAS, settings: undefined },
      context,
    );
    await addAutomationStepTool.handler(
      {
        automationId: source.getId(),
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
    const exportResult = await exportAutomationTool.handler(
      { id: source.getId(), include: undefined },
      context,
    );
    const exportModel = exportResult.structuredContent as Record<string, unknown>;

    await source.delete();

    const result = await importAutomationTool.handler(
      { workspaceId: workspace.getId(), exportModel: exportModel as never },
      context,
    );

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await importAutomationTool.handler(
      {
        workspaceId: "not-a-guid",
        exportModel: {
          formatVersion: "1.0",
          exportedAt: new Date().toISOString(),
          exportedFrom: { product: "Umbraco.Automate", version: "0.0.0" },
          automation: {
            id: "00000000-0000-0000-0000-000000000000",
            alias: TEST_ALIAS,
            name: "Doesn't matter",
            description: null,
            trigger: null,
            steps: [],
            connections: [],
            canvasState: null,
            notificationSettings: null,
          },
          connectionReferences: [],
        } as never,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
