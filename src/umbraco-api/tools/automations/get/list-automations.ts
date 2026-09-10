/**
 * List Automations Tool
 *
 * Lists automations, optionally filtered by name/alias, workspace, or group.
 * Returns a page of summary items (not the full step graph) - use
 * get-automation to fetch the full definition of a specific automation.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsQueryParams,
  getAutomationsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const listAutomationsTool = {
  name: "list-automations",
  description:
    "Lists automations with optional filtering by name/alias (filter), workspaceId, or groupId, plus skip/take paging. Each item is a summary (id, alias, name, status, health, triggerAlias, version) - use get-automation with the returned id to fetch the full step/connection graph before editing.",
  inputSchema: getAutomationsQueryParams.shape,
  outputSchema: getAutomationsResponse,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async (params) => {
    return executeGetApiCall<ReturnType<ApiClient["getAutomations"]>, ApiClient>(
      (client) => client.getAutomations(params, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<
  typeof getAutomationsQueryParams.shape,
  typeof getAutomationsResponse
>;

export default withStandardDecorators(listAutomationsTool);
