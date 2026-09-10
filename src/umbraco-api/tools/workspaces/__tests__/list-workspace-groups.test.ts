import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
  WorkspaceTestHelper,
} from "./setup.js";
import listWorkspaceGroupsTool from "../get/list-workspace-groups.js";

const TEST_ALIAS = "_testListWorkspaceGroups";

describe("list-workspace-groups", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let parentGroup: WorkspaceGroupBuilder;
  let childGroup: WorkspaceGroupBuilder;

  beforeEach(async () => {
    workspace = await new WorkspaceBuilder().withAlias(TEST_ALIAS).create();
    parentGroup = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test List Groups Parent")
      .create();
    childGroup = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test List Groups Child")
      .withParentId(parentGroup.getId())
      .create();
  });

  afterEach(async () => {
    if (childGroup) await childGroup.delete();
    if (parentGroup) await parentGroup.delete();
    if (workspace) await workspace.delete();
  });

  // Note: despite the tool description saying omitting parentGroupId lists
  // "every group in the workspace", the underlying API only returns
  // top-level groups (parentId: null) when parentGroupId is omitted —
  // verified directly against the connected instance. This test asserts
  // that actual behavior rather than the (inaccurate) description.
  it("should list only top-level groups when parentGroupId is omitted", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listWorkspaceGroupsTool.handler(
      { workspaceId: workspace.getId(), parentGroupId: undefined },
      context
    );

    const snapshot = createSnapshotResult(result);
    expect(WorkspaceTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should scope to children of a given parent group", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listWorkspaceGroupsTool.handler(
      { workspaceId: workspace.getId(), parentGroupId: parentGroup.getId() },
      context
    );

    const snapshot = createSnapshotResult(result);
    expect(WorkspaceTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });
});
