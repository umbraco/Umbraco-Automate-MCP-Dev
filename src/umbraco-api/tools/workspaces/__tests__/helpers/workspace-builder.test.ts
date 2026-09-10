import {
  setupTestEnvironment,
  WorkspaceBuilder,
  WorkspaceTestHelper,
} from "../setup.js";

const TEST_NAME = "_Test Builder Workspace";
const TEST_ALIAS = "_testBuilderWorkspace";

describe("WorkspaceBuilder", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder;

  afterEach(async () => {
    if (builder) await builder.delete();
    await WorkspaceTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create workspace with builder", async () => {
    builder = await new WorkspaceBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .create();

    expect(builder.getId()).toBeDefined();

    const found = await WorkspaceTestHelper.findByAlias(TEST_ALIAS);
    expect(found).toBeDefined();
    expect(found?.name).toBe(TEST_NAME);
  });
});
