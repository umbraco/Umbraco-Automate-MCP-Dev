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

  // SDK 1.0.0-beta.47 ran URL checks on every input string and rejected '?' / '&' / '%'
  // in free text; beta.48 (Umbraco-MCP-Base#456) only checks the request path.
  it("should accept '?', '&' and '%' in the name and description", async () => {
    const context = createMockRequestHandlerExtra();
    const name = "_Test Q&A? Create";
    const description = "Runs when? Joost & Co publish 50% of pages";

    const result = await createAutomationTool.handler(
      {
        alias: TEST_ALIAS,
        name,
        description,
        workspaceId: workspace.getId(),
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    createdId = (result.structuredContent as { id: string } | undefined)?.id;
    const stored = await AutomationTestHelper.findByAlias(TEST_ALIAS);
    expect({ name: stored?.name, description: stored?.description }).toEqual({ name, description });
  });

  it("should still reject control characters in the description", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createAutomationTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Automation",
        description: "line one\u0000line two",
        workspaceId: workspace.getId(),
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toMatch(/control character/i);
    expect(await AutomationTestHelper.findByAlias(TEST_ALIAS)).toBeUndefined();
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
