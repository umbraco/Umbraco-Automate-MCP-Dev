import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  VersionHistoryTestHelper,
} from "./setup.js";
import listVersionHistoryTool from "../get/list-version-history.js";
import addAutomationStepTool from "../../automations/post/add-automation-step.js";
import updateAutomationTool from "../../automations/put/update-automation.js";
import setAutomationTriggerTool from "../../automations/put/set-automation-trigger.js";

const TEST_WORKSPACE_ALIAS = "_testWsVerHist_list";
const TEST_AUTOMATION_ALIAS = "_test_verhist_list_automation";

describe("list-version-history", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace VerHist List")
      .create();

    automation = await new AutomationBuilder()
      .withAlias(TEST_AUTOMATION_ALIAS)
      .withName("_Test VerHist List Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const context = createMockRequestHandlerExtra();

    // Make a few real edits so there is genuine version history to list.
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias: "umbracoAutomate.delay",
        alias: "delayStep",
        name: "Delay",
        settings: { duration: "00:00:05" },
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      context,
    );

    await updateAutomationTool.handler(
      {
        automationId: automation.getId(),
        name: "_Test VerHist List Automation Renamed",
        alias: undefined,
        description: undefined,
        groupId: undefined,
      },
      context,
    );

    await setAutomationTriggerTool.handler(
      {
        automationId: automation.getId(),
        triggerAlias: "umbracoAutomate.manual",
        settings: undefined,
      },
      context,
    );
  });

  afterAll(async () => {
    await automation.delete();
    await workspace.delete();
    await AutomationTestHelper.cleanup(TEST_AUTOMATION_ALIAS);
  });

  it("should list recorded versions for an entity that has been edited", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listVersionHistoryTool.handler(
      { entityType: "Automation", entityId: automation.getId() },
      context,
    );

    expect(
      VersionHistoryTestHelper.normalize(createSnapshotResult(result, automation.getId())),
    ).toMatchSnapshot();
  });

  it("should return an error for an unsupported entityType", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listVersionHistoryTool.handler(
      { entityType: "NotARealType", entityId: automation.getId() },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
