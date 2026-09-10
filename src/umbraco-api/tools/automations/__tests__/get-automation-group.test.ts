import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationTestHelper,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
} from "./setup.js";
import getAutomationGroupTool from "../get/get-automation-group.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_group";

describe("get-automation-group", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let group: WorkspaceGroupBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Group")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    if (group) await group.delete();
  });

  it("should return a workspace group by id", async () => {
    const context = createMockRequestHandlerExtra();
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Automation Group")
      .create();

    const result = await getAutomationGroupTool.handler({ groupId: group.getId() }, context);

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a non-existent groupId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getAutomationGroupTool.handler(
      { groupId: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
