/**
 * Test Connection Tool
 *
 * Validates that a saved connection's credentials/settings actually work
 * against the third-party service, without persisting any state.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  postConnectionsByIdTestParams,
  postConnectionsByIdTestResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postConnectionsByIdTestParams.shape,
  id: postConnectionsByIdTestParams.shape.id.describe(
    "Id of the saved connection to test.",
  ),
};

const testConnectionTool = {
  name: "test-connection",
  description:
    "Tests an already-saved connection by id — attempts to reach the third-party service with its stored settings and reports whether the credentials/endpoint are valid. Read-only: it does not change the connection or create/consume any resource on the third-party side. Returns a status of Success, Warning or Failure plus human-readable details explaining the result. Use this after create-connection or update-connection to confirm the credentials actually work.",
  inputSchema,
  outputSchema: postConnectionsByIdTestResponse,
  slices: ["action"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["postConnectionsByIdTest"]>,
      ApiClient
    >((client) => client.postConnectionsByIdTest(id, CAPTURE_RAW_HTTP_RESPONSE));
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof postConnectionsByIdTestResponse
>;

export default withStandardDecorators(testConnectionTool);
