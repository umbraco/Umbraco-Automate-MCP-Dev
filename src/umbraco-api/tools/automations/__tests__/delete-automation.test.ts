import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "./setup.js";
import deleteAutomationTool from "../delete/delete-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_delete";
const TEST_ALIAS = "_test_delete_automation";

describe("delete-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Delete")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    await AutomationTestHelper.cleanup(TEST_ALIAS);
  });

  it("should permanently delete an automation", async () => {
    const context = createMockRequestHandlerExtra();
    const automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Delete Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const result = await deleteAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const found = await AutomationTestHelper.findByAlias(TEST_ALIAS);
    expect(found).toBeUndefined();
  });

  it("should return an error for a non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await deleteAutomationTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
