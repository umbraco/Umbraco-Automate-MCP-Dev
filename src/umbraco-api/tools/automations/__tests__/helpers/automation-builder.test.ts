import {
  setupTestEnvironment,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
} from "../setup.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_builder";
const TEST_ALIAS = "_test_builder_automation";

describe("AutomationBuilder", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let builder: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Builder")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    // Always clean up created automations to prevent conflicts with other test files
    if (builder) await builder.delete();
    await AutomationTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create automation with builder", async () => {
    builder = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Builder Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    expect(builder.getId()).toBeDefined();

    const found = await AutomationTestHelper.findByAlias(TEST_ALIAS);
    expect(found).toBeDefined();
    expect(found?.alias).toBe(TEST_ALIAS);
  });
});
