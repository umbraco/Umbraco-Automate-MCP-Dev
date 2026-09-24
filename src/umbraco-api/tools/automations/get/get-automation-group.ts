/**
 * Get Automation Group Tool
 *
 * Fetches a single workspace group (folder) that automations can be
 * organized under. Use list-automations with groupId to see the automations
 * inside a group, and get-automation-ancestors to find a group's parents.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsGroupsByGroupIdParams,
  getAutomationsGroupsByGroupIdResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getAutomationsGroupsByGroupIdParams.shape,
  groupId: getAutomationsGroupsByGroupIdParams.shape.groupId.describe(
    "Id of the workspace group (an automation's groupId, or an id from list-workspace-groups).",
  ),
};

const getAutomationGroupTool = {
  name: "get-automation-group",
  description:
    "Gets a single workspace group (folder used to organize automations) by id, including its parent group and owning workspace. Use list-automations with groupId to list the automations inside this group.",
  inputSchema,
  outputSchema: getAutomationsGroupsByGroupIdResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ groupId }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["getAutomationsGroupsByGroupId"]>,
      ApiClient
    >((client) =>
      client.getAutomationsGroupsByGroupId(groupId, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof getAutomationsGroupsByGroupIdResponse
>;

export default withStandardDecorators(getAutomationGroupTool);
