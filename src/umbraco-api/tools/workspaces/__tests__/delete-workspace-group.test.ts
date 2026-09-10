import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
} from "./setup.js";
import deleteWorkspaceGroupTool from "../delete/delete-workspace-group.js";
import getWorkspaceGroupTool from "../get/get-workspace-group.js";

const TEST_ALIAS = "_testDeleteWorkspaceGroup";

describe("delete-workspace-group", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;

  beforeEach(async () => {
    workspace = await new WorkspaceBuilder().withAlias(TEST_ALIAS).create();
  });

  afterEach(async () => {
    if (workspace) await workspace.delete();
  });

  it("should delete a group", async () => {
    const context = createMockRequestHandlerExtra();
    const group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Delete Group")
      .create();

    const result = await deleteWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );

    // delete-workspace-group is a void call (no structuredContent) —
    // snapshot the standard success shape, and verify the actual effect below.
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const afterDelete = await getWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );
    expect(afterDelete.isError).toBe(true);
  });

  it("should return error for already-deleted group", async () => {
    const context = createMockRequestHandlerExtra();
    const group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Delete Group Twice")
      .create();

    await deleteWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );
    const result = await deleteWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );

    expect(result.isError).toBe(true);
  });
});
