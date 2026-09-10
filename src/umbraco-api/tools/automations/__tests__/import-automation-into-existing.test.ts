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
  TEST_STEP_ALIAS_2,
  TEST_TRIGGER_ALIAS,
} from "./setup.js";
import addAutomationStepTool from "../post/add-automation-step.js";
import setAutomationTriggerTool from "../put/set-automation-trigger.js";
import exportAutomationTool from "../get/export-automation.js";
import importAutomationIntoExistingTool from "../put/import-automation-into-existing.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_importExisting";
const TEST_ALIAS = "_test_import_existing_automation";

describe("import-automation-into-existing", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Import Existing")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Import Existing Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    await automation.delete();
    await AutomationTestHelper.cleanup(TEST_ALIAS);
  });

  it("should restore a previously-exported definition onto the same automation", async () => {
    // The export file's automation id must match the target automation's own id - confirmed
    // against the real instance (a 400 "does not match the target automation ID" otherwise).
    // So this isn't for moving a definition to an arbitrary other automation; the realistic
    // scenario is restoring a backup of THIS SAME automation - export it, change it, then
    // import the original export back onto it.
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
    const backupResult = await exportAutomationTool.handler(
      { id: automation.getId(), include: undefined },
      context,
    );
    const backupExportModel = backupResult.structuredContent as Record<string, unknown>;

    // Diverge from the backup by adding a second step.
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias: TEST_ACTION_ALIAS,
        alias: TEST_STEP_ALIAS_2,
        name: "Delay Step 2",
        settings: TEST_ACTION_SETTINGS,
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      context,
    );

    const result = await importAutomationIntoExistingTool.handler(
      { id: automation.getId(), exportModel: backupExportModel as never },
      context,
    );

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error when the export's automation id doesn't match the target", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await importAutomationIntoExistingTool.handler(
      {
        id: automation.getId(),
        exportModel: {
          formatVersion: "1.0",
          exportedAt: new Date().toISOString(),
          exportedFrom: { product: "Umbraco.Automate", version: "0.0.0" },
          automation: {
            id: "00000000-0000-0000-0000-000000000000",
            alias: TEST_ALIAS,
            name: "Mismatched Export",
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
