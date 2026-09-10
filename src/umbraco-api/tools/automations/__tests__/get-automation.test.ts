import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "./setup.js";
import getAutomationTool from "../get/get-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_get";
const TEST_ALIAS = "_test_get_automation";

describe("get-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Get")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    if (automation) await automation.delete();
  });

  it("should return the full definition of an automation by id", async () => {
    const context = createMockRequestHandlerExtra();
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Get Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const result = await getAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result, automation.getId());
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getAutomationTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
