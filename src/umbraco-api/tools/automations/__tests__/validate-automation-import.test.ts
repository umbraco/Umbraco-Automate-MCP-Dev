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
import validateAutomationImportTool from "../post/validate-automation-import.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_validateImport";
const TEST_ALIAS = "_test_validate_import_automation";

describe("validate-automation-import", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;
  let exportModel: Record<string, unknown>;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Validate Import")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Validate Import Automation")
      .withWorkspaceId(workspace.getId())
      .create();

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

    const exportResult = await exportAutomationTool.handler(
      { id: automation.getId(), include: undefined },
      context,
    );
    exportModel = exportResult.structuredContent as Record<string, unknown>;
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should validate a real exported definition against the workspace without changing anything", async () => {
    // The exported blob keeps its source automation's own id, and that automation still
    // exists (in this same workspace) at the moment of validation - so the real, deterministic
    // outcome here is success: false with a "such an id already exists" error, which is itself
    // a useful thing to verify this tool reports correctly. Confirmed against the real
    // instance that this conflict is NOT scoped by workspace (an id match anywhere conflicts).
    const context = createMockRequestHandlerExtra();

    const result = await validateAutomationImportTool.handler(
      { workspaceId: workspace.getId(), exportModel: exportModel as never },
      context,
    );

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await validateAutomationImportTool.handler(
      { workspaceId: "not-a-guid", exportModel: exportModel as never },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
