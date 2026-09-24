import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
  getDefaultTimeoutMs,
} from "@umbraco-cms/mcp-server-sdk/evals";

const CONNECTION_TOOLS = [
  "list-connections",
  "get-connection",
  "create-connection",
  "update-connection",
  "delete-connection",
] as const;

describe("Connections CRUD Operations", () => {
  setupConsoleMock();
  const timeout = getDefaultTimeoutMs();

  it(
    "should complete full CRUD workflow",
    runScenarioTest({
      prompt: `Complete these tasks in order.
1. Generate a unique identifier using the current timestamp (call it {timestamp}).
2. Create a new connection with alias "eval-connection-{timestamp}", name "Eval Connection {timestamp}", type "http", and settings { "baseUrl": "https://example.com", "apiKey": "eval-test-key" }. Do not look up the connection-types catalogue first - "http" with these settings is already known to be accepted by this instance for testing purposes.
3. List connections filtering by the name "Eval Connection {timestamp}" and confirm the one you created appears in the results, noting its id.
4. Get the connection you created by its id to verify the details, and note its current "version" value from the response.
5. Update the connection by its id: change its name to "Updated Eval Connection {timestamp}", keep the alias, type and settings the same, and pass the "version" value you got from step 4.
6. Delete the connection you created by its id.
7. Say "Connection CRUD workflow completed successfully"`,
      tools: [...CONNECTION_TOOLS],
      requiredTools: [
        "create-connection",
        "list-connections",
        "get-connection",
        "update-connection",
        "delete-connection",
      ],
      successPattern: "Connection CRUD workflow completed successfully",
      verbose: false,
    }),
    timeout
  );
});
