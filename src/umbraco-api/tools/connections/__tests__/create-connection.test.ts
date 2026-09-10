import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  ConnectionTestHelper,
} from "./setup.js";
import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import createConnectionTool from "../post/create-connection.js";
import deleteConnectionTool from "../delete/delete-connection.js";

const TEST_ALIAS = "_test_create_connection";

describe("create-connection", () => {
  setupTestEnvironment();

  let createdId: string | undefined;

  afterEach(async () => {
    if (createdId) {
      const context = createMockRequestHandlerExtra();
      await deleteConnectionTool.handler({ id: createdId }, context);
      createdId = undefined;
    }
    await ConnectionTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create a connection", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await createConnectionTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Connection",
        type: "http",
        settings: { baseUrl: "https://example.invalid", apiKey: "secret-value-123" },
      },
      context,
    );

    const data = validateToolResponse(createConnectionTool, result);
    createdId = data.id;

    expect(createSnapshotResult(result, createdId)).toMatchSnapshot();
  });

  it("should return an error for a duplicate alias", async () => {
    const context = createMockRequestHandlerExtra();

    const first = await createConnectionTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Connection Duplicate",
        type: "http",
        settings: { baseUrl: "https://example.invalid", apiKey: "secret-value-123" },
      },
      context,
    );
    const firstData = validateToolResponse(createConnectionTool, first);
    createdId = firstData.id;

    const result = await createConnectionTool.handler(
      {
        alias: TEST_ALIAS,
        name: "_Test Create Connection Duplicate 2",
        type: "http",
        settings: { baseUrl: "https://example.invalid", apiKey: "secret-value-123" },
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
