/**
 * List Connections Tool
 *
 * Lists configured connections (credentials/endpoints to third-party services)
 * that automation steps can use.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getConnectionsQueryParams,
  getConnectionsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getConnectionsQueryParams.shape,
  filter: getConnectionsQueryParams.shape.filter.describe(
    "Optional text matched against connection name and alias.",
  ),
};

const listConnectionsTool = {
  name: "list-connections",
  description:
    "Lists connections configured for this Umbraco instance — the credentials/endpoints automation steps use to talk to third-party services (e.g. an email provider, a REST API, a Slack workspace). Each item includes id, alias, name, type and version, but not the connection's settings/secrets — use get-connection for the full detail on a single connection. Supports an optional text filter and cursor paging (pass nextCursor from the previous response). A connection's `type` must match one of the aliases returned by the catalogue's connection-types listing.",
  inputSchema,
  outputSchema: getConnectionsResponse,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ filter, skip, take }) => {
    return executeGetApiCall<ReturnType<ApiClient["getConnections"]>, ApiClient>(
      (client) =>
        client.getConnections({ filter, skip, take }, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof getConnectionsResponse
>;

export default withStandardDecorators(listConnectionsTool);
