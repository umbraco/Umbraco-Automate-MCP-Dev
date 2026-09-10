import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
  WorkspaceTestHelper,
} from "./setup.js";
import listWorkspacesTool from "../get/list-workspaces.js";

const TEST_ALIAS = "_testListWorkspace";
const TEST_NAME = "_Test List Workspace";

describe("list-workspaces", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder;

  beforeEach(async () => {
    builder = await new WorkspaceBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .create();
  });

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should list workspaces filtered by alias", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listWorkspacesTool.handler(
      { filter: TEST_ALIAS },
      context
    );

    const snapshot = createSnapshotResult(result, builder.getId());
    expect(WorkspaceTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  });

  it("should return an empty list for a filter matching nothing", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listWorkspacesTool.handler(
      { filter: "_noSuchWorkspaceAliasAtAll" },
      context
    );

    const data = validateToolResponse(listWorkspacesTool, result);
    expect(data.items).toEqual([]);
  });
});
