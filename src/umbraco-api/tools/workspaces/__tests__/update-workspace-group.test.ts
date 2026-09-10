import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
} from "./setup.js";
import updateWorkspaceGroupTool from "../put/update-workspace-group.js";
import getWorkspaceGroupTool from "../get/get-workspace-group.js";

const TEST_ALIAS = "_testUpdateWorkspaceGroup";

describe("update-workspace-group", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let group: WorkspaceGroupBuilder;
  let otherGroup: WorkspaceGroupBuilder;

  beforeEach(async () => {
    workspace = await new WorkspaceBuilder().withAlias(TEST_ALIAS).create();
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Update Group")
      .create();
  });

  afterEach(async () => {
    if (otherGroup) await otherGroup.delete();
    if (group) await group.delete();
    if (workspace) await workspace.delete();
  });

  it("should rename a group and re-nest it under a parentId", async () => {
    const context = createMockRequestHandlerExtra();
    otherGroup = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Update Group New Parent")
      .create();

    const result = await updateWorkspaceGroupTool.handler(
      {
        workspaceId: workspace.getId(),
        groupId: group.getId(),
        name: "_Test Update Group Renamed",
        parentId: otherGroup.getId(),
      },
      context
    );

    // update-workspace-group is a void call (no structuredContent) —
    // snapshot the standard success shape, and verify the actual effect below.
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const updated = await getWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );
    const data = validateToolResponse(getWorkspaceGroupTool, updated);
    expect(data.name).toBe("_Test Update Group Renamed");
    expect(data.parentId).toBe(otherGroup.getId());
  });

  it("should return error for a non-existent group", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await updateWorkspaceGroupTool.handler(
      {
        workspaceId: workspace.getId(),
        groupId: "00000000-0000-0000-0000-000000000000",
        name: "_Test Update Missing Group",
        parentId: undefined,
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
