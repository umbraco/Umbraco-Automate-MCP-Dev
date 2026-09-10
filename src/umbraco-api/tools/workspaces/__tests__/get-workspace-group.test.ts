import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
  WorkspaceTestHelper,
} from "./setup.js";
import getWorkspaceGroupTool from "../get/get-workspace-group.js";

const TEST_ALIAS = "_testGetWorkspaceGroup";

describe("get-workspace-group", () => {
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

  it("should return a top-level group by id", async () => {
    const context = createMockRequestHandlerExtra();
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Get Group")
      .create();

    const result = await getWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );

    const snapshot = createSnapshotResult(result, group.getId());
    expect(WorkspaceTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return a nested group with its parentId", async () => {
    const context = createMockRequestHandlerExtra();
    const parent = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Get Group Parent")
      .create();
    group = await new WorkspaceGroupBuilder(workspace.getId())
      .withName("_Test Get Group Child")
      .withParentId(parent.getId())
      .create();

    const result = await getWorkspaceGroupTool.handler(
      { workspaceId: workspace.getId(), groupId: group.getId() },
      context
    );

    const data = validateToolResponse(getWorkspaceGroupTool, result);
    expect(data.parentId).toBe(parent.getId());

    await parent.delete();
  });

  it("should return error for non-existent group", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getWorkspaceGroupTool.handler(
      {
        workspaceId: workspace.getId(),
        groupId: "00000000-0000-0000-0000-000000000000",
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
