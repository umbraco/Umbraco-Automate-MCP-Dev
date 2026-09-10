import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
} from "./setup.js";
import deleteWorkspaceTool from "../delete/delete-workspace.js";
import getWorkspaceTool from "../get/get-workspace.js";

const TEST_ALIAS = "_testDeleteWorkspace";

describe("delete-workspace", () => {
  setupTestEnvironment();

  it("should delete a workspace", async () => {
    const context = createMockRequestHandlerExtra();
    const builder = await new WorkspaceBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Delete Workspace")
      .create();

    const result = await deleteWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );

    // delete-workspace is a void call (no structuredContent) — snapshot the
    // standard success shape, and verify the actual effect below.
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const afterDelete = await getWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );
    expect(afterDelete.isError).toBe(true);
  });

  it("should return error for already-deleted workspace", async () => {
    const context = createMockRequestHandlerExtra();
    const builder = await new WorkspaceBuilder()
      .withAlias("_testDeleteWorkspaceTwice")
      .withName("_Test Delete Workspace Twice")
      .create();

    await deleteWorkspaceTool.handler({ workspaceId: builder.getId() }, context);
    const result = await deleteWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );

    expect(result.isError).toBe(true);
  });
});
