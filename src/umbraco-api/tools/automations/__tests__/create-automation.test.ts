import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "./setup.js";
import createAutomationTool from "../post/create-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_create";
const TEST_ALIAS = "_test_create_automation";

describe("create-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let createdId: string | undefined;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Create")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    if (createdId) {
      await AutomationTestHelper.cleanup(TEST_ALIAS);
      createdId = undefined;
    }
  });

  it("should create a draft automation in a workspace", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createAutomationTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Automation",
        description: undefined,
        workspaceId: workspace.getId(),
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    const structured = result.structuredContent as { id: string } | undefined;
    createdId = structured?.id;
    expect(createdId).toBeDefined();

    expect(createSnapshotResult(result, createdId)).toMatchSnapshot();
  });

  it("should return an error when the alias already exists", async () => {
    const context = createMockRequestHandlerExtra();

    // The API's own alias-uniqueness constraint is enforced by a DB unique index, not
    // pre-validated by the endpoint - so the first call must succeed and the second (same
    // alias, same workspace) is what triggers the error this test checks for.
    const first = await createAutomationTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Automation",
        description: undefined,
        workspaceId: workspace.getId(),
        groupId: undefined,
      },
      context,
    );
    expect(first.isError).toBeFalsy();
    createdId = (first.structuredContent as { id: string } | undefined)?.id;

    const result = await createAutomationTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Automation Duplicate",
        description: undefined,
        workspaceId: workspace.getId(),
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
