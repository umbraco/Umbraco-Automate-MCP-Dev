import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  WorkspaceTestHelper,
} from "./setup.js";
import { getTestServiceAccountKey } from "./helpers/workspace-builder.js";
import createWorkspaceTool from "../post/create-workspace.js";

const TEST_ALIAS = "_testCreateWorkspace";
const TEST_NAME = "_Test Create Workspace";

describe("create-workspace", () => {
  setupTestEnvironment();

  afterEach(async () => {
    await WorkspaceTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create a workspace", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createWorkspaceTool.handler(
      {
        alias: TEST_ALIAS,
        name: TEST_NAME,
        serviceAccountKey: await getTestServiceAccountKey(),
        userGroups: [],
        allowedConnections: [],
      },
      context
    );

    const snapshot = createSnapshotResult(result);
    const structuredContent = snapshot.structuredContent as
      | { location?: string }
      | undefined;
    if (structuredContent?.location) {
      structuredContent.location = WorkspaceTestHelper.normalizeBaseUrl(
        structuredContent.location.replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          "00000000-0000-0000-0000-000000000000"
        )
      );
    }
    expect(snapshot).toMatchSnapshot();
  });

  it("should return error for duplicate alias", async () => {
    const context = createMockRequestHandlerExtra();

    await createWorkspaceTool.handler(
      {
        alias: TEST_ALIAS,
        name: TEST_NAME,
        serviceAccountKey: await getTestServiceAccountKey(),
        userGroups: [],
        allowedConnections: [],
      },
      context
    );

    const result = await createWorkspaceTool.handler(
      {
        alias: TEST_ALIAS,
        name: TEST_NAME,
        serviceAccountKey: await getTestServiceAccountKey(),
        userGroups: [],
        allowedConnections: [],
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
