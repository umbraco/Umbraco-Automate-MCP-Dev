import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
} from "./setup.js";
import getAutomationAncestorsTool from "../get/get-automation-ancestors.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_ancestors";
const TEST_ALIAS = "_test_ancestors_automation";

describe("get-automation-ancestors", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let group: WorkspaceGroupBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Ancestors")
      .create();
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Ancestors Group")
      .create();
  });

  afterAll(async () => {
    await group.delete();
    await workspace.delete();
  });

  afterEach(async () => {
    if (automation) await automation.delete();
  });

  it("should list the workspace/group ancestry above an automation", async () => {
    const context = createMockRequestHandlerExtra();
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Ancestors Automation")
      .withWorkspaceId(workspace.getId())
      .withGroupId(group.getId())
      .create();

    const result = await getAutomationAncestorsTool.handler(
      { id: automation.getId() },
      context,
    );

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result);
    expect(AutomationTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an error for a non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getAutomationAncestorsTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
