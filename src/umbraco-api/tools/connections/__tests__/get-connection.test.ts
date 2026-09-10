import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  ConnectionBuilder,
} from "./setup.js";
import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import getConnectionTool from "../get/get-connection.js";

const TEST_ALIAS = "_test_get_connection";

describe("get-connection", () => {
  setupTestEnvironment();

  let builder: ConnectionBuilder;

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should return a connection by id with secret settings redacted", async () => {
    const context = createMockRequestHandlerExtra();
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Get Connection")
      .create();

    const result = await getConnectionTool.handler({ id: builder.getId() }, context);

    // The connection was created with settings.apiKey — get-connection redacts any
    // settings field whose name matches a secret pattern (secret/password/token/apiKey/etc.)
    const data = validateToolResponse(getConnectionTool, result) as any;
    expect(data.settings.apiKey).toBe("***REDACTED***");
    expect(data.settings.baseUrl).toBe("https://example.invalid");

    // The SDK's date normalization list doesn't include this API's dateCreated/
    // dateModified field names, so normalize them manually before snapshotting.
    const normalizedResult = {
      ...result,
      structuredContent: result.structuredContent && {
        ...(result.structuredContent as Record<string, unknown>),
        dateCreated: "NORMALIZED_DATE",
        dateModified: "NORMALIZED_DATE",
      },
    };

    expect(createSnapshotResult(normalizedResult, builder.getId())).toMatchSnapshot();
  });

  it("should return an error for a non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getConnectionTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
