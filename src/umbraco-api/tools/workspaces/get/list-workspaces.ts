/**
 * List Workspaces Tool
 *
 * Lists workspaces with optional name/alias filtering and pagination. A
 * workspace is the top-level container that scopes a set of automations,
 * groups (folders that organize those automations), the connections
 * automations inside it may use, and which Umbraco user groups can manage it.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getWorkspacesQueryParams,
  getWorkspacesResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getWorkspacesQueryParams.shape,
  filter: getWorkspacesQueryParams.shape.filter.describe(
    "Optional text matched against workspace name and alias.",
  ),
};
const outputSchema = getWorkspacesResponse;

const listWorkspacesTool = {
  name: "list-workspaces",
  description:
    "Lists workspaces, optionally filtered by name/alias, with cursor paging (pass nextCursor from the previous response). Each result includes the workspace id, alias, name, and version needed to fetch, update, or list groups within it. Use list-workspace-groups afterwards to see how a specific workspace organizes its automations into groups.",
  inputSchema,
  outputSchema,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ filter, skip, take }) => {
    return executeGetApiCall<ReturnType<ApiClient["getWorkspaces"]>, ApiClient>(
      (client) =>
        client.getWorkspaces({ filter, skip, take }, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(listWorkspacesTool);
