/**
 * Get Workspace Tool
 *
 * Fetches a single workspace by id, including its alias, the service account
 * key it runs automations as, the user groups allowed to manage it, and the
 * connections its automations are allowed to use. The returned `version`
 * value is required when calling update-workspace.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getWorkspacesByIdResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace to fetch."),
};
const outputSchema = getWorkspacesByIdResponse;

const getWorkspaceTool = {
  name: "get-workspace",
  description:
    "Gets a single workspace by id. Returns its alias, name, service account key, allowed user groups and connections, and the optimistic-concurrency `version` needed for update-workspace. Use list-workspaces to find a workspace id first.",
  inputSchema,
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ workspaceId }) => {
    return executeGetApiCall<ReturnType<ApiClient["getWorkspacesById"]>, ApiClient>(
      (client) => client.getWorkspacesById(workspaceId, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(getWorkspaceTool);
