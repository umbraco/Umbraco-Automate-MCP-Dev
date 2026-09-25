/**
 * Delete Connection Tool
 *
 * Permanently removes a connection. Any automation step that references it
 * will fail at runtime until repointed to a different connection.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { deleteConnectionsByIdParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...deleteConnectionsByIdParams.shape,
  id: deleteConnectionsByIdParams.shape.id.describe(
    "Id of the connection to delete permanently.",
  ),
};

const deleteConnectionTool = {
  name: "delete-connection",
  description:
    "Permanently deletes a connection by id. This is not reversible and is not idempotent — calling it again on an already-deleted connection returns a not-found error. Any automation step still referencing this connection will fail the next time it runs, so check for references before deleting.",
  inputSchema,
  slices: ["delete"],
  annotations: {
    destructiveHint: true,
  },
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.deleteConnectionsById(id, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(deleteConnectionTool);
