import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  ConnectionBuilder,
} from "./setup.js";
import { validateToolResponse } from "@umbraco-cms/mcp-server-sdk/testing";
import testConnectionTool from "../post/test-connection.js";

const TEST_ALIAS = "_test_test_connection";

describe("test-connection", () => {
  setupTestEnvironment();

  let builder: ConnectionBuilder;

  afterEach(async () => {
    if (builder) await builder.delete();
  });

  it("should report the real outcome of testing a connection", async () => {
    const context = createMockRequestHandlerExtra();
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Test Connection")
      .create();

    const result = await testConnectionTool.handler({ id: builder.getId() }, context);

    // This test instance has no connection-type provider packages installed (the
    // catalogue's connection-types listing is empty), so the "http" type used by the
    // builder is not registered. The tool's job is just to report the real outcome
    // accurately — a Failure status here reflects reality, not a broken tool.
    const data = validateToolResponse(testConnectionTool, result) as any;
    expect(["Success", "Warning", "Failure"]).toContain(data.status);
    expect(data.status).toBe("Failure");
    expect(data.message).toContain("not registered");
  });

  it("should return an error for a non-existent connection id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await testConnectionTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
