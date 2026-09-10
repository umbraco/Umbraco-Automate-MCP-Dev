/**
 * Get Workspace Group Tool
 *
 * Fetches a single group within a workspace by id. Groups are folders used
 * to organize the automations that live inside a workspace, and can be
 * nested via `parentId`.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getWorkspacesByIdGroupsByGroupIdResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace the group belongs to."),
  groupId: z.string().describe("The id of the group to fetch."),
};
const outputSchema = getWorkspacesByIdGroupsByGroupIdResponse;

const getWorkspaceGroupTool = {
  name: "get-workspace-group",
  description:
    "Gets a single group within a workspace by id, including its name and optional parentId for nesting. Use list-workspace-groups to find a group id first, and automations tools to see the automations filed under it.",
  inputSchema,
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ workspaceId, groupId }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["getWorkspacesByIdGroupsByGroupId"]>,
      ApiClient
    >((client) =>
      client.getWorkspacesByIdGroupsByGroupId(
        workspaceId,
        groupId,
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(getWorkspaceGroupTool);
