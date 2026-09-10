import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceBuilder,
} from "./setup.js";
import { TEST_SERVICE_ACCOUNT_KEY } from "./helpers/workspace-builder.js";
import updateWorkspaceTool from "../put/update-workspace.js";
import getWorkspaceTool from "../get/get-workspace.js";

const TEST_ALIAS = "_testUpdateWorkspace";

describe("update-workspace", () => {
  setupTestEnvironment();

  let builder: WorkspaceBuilder;

  beforeEach(async () => {
    builder = await new WorkspaceBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Update Workspace")
      .create();
  });

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should update a workspace's name", async () => {
    const context = createMockRequestHandlerExtra();

    // Fetch fresh version before updating, per the tool's own guidance.
    const current = await getWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );
    const version = validateToolResponse(getWorkspaceTool, current).version;

    const result = await updateWorkspaceTool.handler(
      {
        workspaceId: builder.getId(),
        alias: TEST_ALIAS,
        name: "_Test Update Workspace Renamed",
        serviceAccountKey: TEST_SERVICE_ACCOUNT_KEY,
        userGroups: [],
        allowedConnections: [],
        version,
      },
      context
    );

    // update-workspace is a void call (no structuredContent) — snapshot it
    // for the standard success shape, and verify the actual effect below.
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const updated = await getWorkspaceTool.handler(
      { workspaceId: builder.getId() },
      context
    );
    expect(validateToolResponse(getWorkspaceTool, updated).name).toBe(
      "_Test Update Workspace Renamed"
    );
  });

  it("should return error for a stale version", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await updateWorkspaceTool.handler(
      {
        workspaceId: builder.getId(),
        alias: TEST_ALIAS,
        name: "_Test Update Workspace Stale",
        serviceAccountKey: TEST_SERVICE_ACCOUNT_KEY,
        userGroups: [],
        allowedConnections: [],
        version: 9999,
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
