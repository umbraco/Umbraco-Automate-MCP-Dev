import {
  setupTestEnvironment,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
} from "../setup.js";

const TEST_ALIAS = "_testGroupBuilderWorkspace";
const TEST_GROUP_NAME = "_Test Builder Group";

describe("WorkspaceGroupBuilder", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let group: WorkspaceGroupBuilder;

  beforeEach(async () => {
    workspace = await new WorkspaceBuilder().withAlias(TEST_ALIAS).create();
  });

  afterEach(async () => {
    if (group) await group.delete();
    if (workspace) await workspace.delete();
  });

  it("should create a workspace group with builder", async () => {
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName(TEST_GROUP_NAME)
      .create();

    expect(group.getId()).toBeDefined();
  });

  it("should create a nested workspace group with a parentId", async () => {
    const parent = await new WorkspaceGroupBuilder(workspace.getId())
      .withName(`${TEST_GROUP_NAME} Parent`)
      .create();

    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName(`${TEST_GROUP_NAME} Child`)
      .withParentId(parent.getId())
      .create();

    expect(group.getId()).toBeDefined();

    await parent.delete();
  });
});
