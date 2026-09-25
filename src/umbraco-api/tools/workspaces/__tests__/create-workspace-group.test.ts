import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
  WorkspaceTestHelper,
} from "./setup.js";
import createWorkspaceGroupTool from "../post/create-workspace-group.js";

const TEST_ALIAS = "_testCreateWorkspaceGroup";

/** Normalizes any embedded guid and the instance host in a Location header URL for snapshotting. */
function normalizeLocation(result: ReturnType<typeof createSnapshotResult>) {
  const structuredContent = result.structuredContent as
    | { location?: string }
    | undefined;
  if (structuredContent?.location) {
    structuredContent.location = WorkspaceTestHelper.normalizeBaseUrl(
      structuredContent.location.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        "00000000-0000-0000-0000-000000000000"
      )
    );
  }
  return result;
}

describe("create-workspace-group", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder;

  beforeEach(async () => {
    builder = await new WorkspaceBuilder().withAlias(TEST_ALIAS).create();
  });

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should create a top-level group in a workspace", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createWorkspaceGroupTool.handler(
      { workspaceId: builder.getId(), name: "_Test Create Group", parentId: undefined },
      context
    );

    expect(normalizeLocation(createSnapshotResult(result))).toMatchSnapshot();
  });

  it("should create a nested group under a parentId", async () => {
    const context = createMockRequestHandlerExtra();
    const parent = await new WorkspaceGroupBuilder(builder.getId())
      .withName("_Test Create Group Parent")
      .create();

    const result = await createWorkspaceGroupTool.handler(
      {
        workspaceId: builder.getId(),
        name: "_Test Create Group Nested Child",
        parentId: parent.getId(),
      },
      context
    );

    // The workspace itself (and its groups) is cleaned up via the outer
    // afterEach, since delete-workspace cascades to its groups.
    expect(normalizeLocation(createSnapshotResult(result))).toMatchSnapshot();
  });

  it("should return error for a non-existent workspace", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createWorkspaceGroupTool.handler(
      {
        workspaceId: "00000000-0000-0000-0000-000000000000",
        name: "_Test Create Group Bad Workspace",
        parentId: undefined,
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
