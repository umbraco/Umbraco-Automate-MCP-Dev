import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "./setup.js";
import listAutomationsTool from "../get/list-automations.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_list";
const TEST_ALIAS = "_test_list_automation";

describe("list-automations", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto List")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    if (automation) await automation.delete();
  });

  it("should list automations filtered by workspaceId", async () => {
    const context = createMockRequestHandlerExtra();
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test List Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const result = await listAutomationsTool.handler(
      { workspaceId: workspace.getId(), filter: undefined, groupId: undefined },
      context,
    );

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listAutomationsTool.handler(
      { workspaceId: "not-a-guid", filter: undefined, groupId: undefined },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
