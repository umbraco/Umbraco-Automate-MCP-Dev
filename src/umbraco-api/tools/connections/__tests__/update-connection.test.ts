import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  ConnectionBuilder,
} from "./setup.js";
import getConnectionTool from "../get/get-connection.js";
import updateConnectionTool from "../put/update-connection.js";

const TEST_ALIAS = "_test_update_connection";

describe("update-connection", () => {
  setupTestEnvironment();

  let builder: ConnectionBuilder;

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should replace a connection's fields", async () => {
    const context = createMockRequestHandlerExtra();
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Update Connection")
      .create();

    // Per the tool's own description: re-fetch the current version before a full replace.
    const current = await getConnectionTool.handler(
      { id: builder.getId() },
      context,
    );
    const currentData = current.structuredContent as any;

    const result = await updateConnectionTool.handler(
      {
        id: builder.getId(),
        alias: TEST_ALIAS,
        name: "_Test Update Connection Renamed",
        type: "http",
        settings: { baseUrl: "https://example-updated.invalid", apiKey: "secret-value-456" },
        version: currentData.version,
      },
      context,
    );

    expect(createSnapshotResult(result, builder.getId())).toMatchSnapshot();

    const verify = await getConnectionTool.handler({ id: builder.getId() }, context);
    const verifyData = verify.structuredContent as any;
    expect(verifyData.name).toBe("_Test Update Connection Renamed");
    expect(verifyData.settings.baseUrl).toBe("https://example-updated.invalid");
  });

  it("should return an error for a stale version", async () => {
    const context = createMockRequestHandlerExtra();
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Update Connection Stale")
      .create();

    const result = await updateConnectionTool.handler(
      {
        id: builder.getId(),
        alias: TEST_ALIAS,
        name: "_Test Update Connection Stale 2",
        type: "http",
        settings: { baseUrl: "https://example.invalid", apiKey: "secret-value-123" },
        version: 999,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
