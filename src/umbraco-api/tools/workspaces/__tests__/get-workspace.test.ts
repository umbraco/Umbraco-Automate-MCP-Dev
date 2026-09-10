import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceTestHelper,
} from "./setup.js";
import getWorkspaceTool from "../get/get-workspace.js";

describe("get-workspace", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder;

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should return workspace by id", async () => {
    const context = createMockRequestHandlerExtra();
    builder = await new WorkspaceBuilder()
      .withAlias("_testGetWorkspace")
      .withName("_Test Get Workspace")
      .create();

    const result = await getWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );

    const snapshot = createSnapshotResult(result, builder.getId());
    expect(
      WorkspaceTestHelper.normalizeIds(snapshot)
    ).toMatchSnapshot();
  });

  it("should return error for non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getWorkspaceTool.handler(
      { workspaceId: "00000000-0000-0000-0000-000000000000" },
      context
    );

    expect(result.isError).toBe(true);
  });
});
