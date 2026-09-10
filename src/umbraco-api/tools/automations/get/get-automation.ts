/**
 * Get Automation Tool
 *
 * Fetches the full definition of a single automation, including its trigger,
 * steps, connections, canvas state and notification settings. This is the
 * "current version" the LLM should read before calling update-automation, so
 * no properties are accidentally dropped when saving changes back.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsByIdParams,
  getAutomationsByIdResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const getAutomationTool = {
  name: "get-automation",
  description:
    "Gets the full definition of an automation by id: trigger, steps, connections, canvas state, notification settings, status, health and version. Read this before calling update-automation so the full body (including steps/connections) is preserved when saving.",
  inputSchema: getAutomationsByIdParams.shape,
  outputSchema: getAutomationsByIdResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    return executeGetApiCall<ReturnType<ApiClient["getAutomationsById"]>, ApiClient>(
      (client) => client.getAutomationsById(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<
  typeof getAutomationsByIdParams.shape,
  typeof getAutomationsByIdResponse
>;

export default withStandardDecorators(getAutomationTool);
