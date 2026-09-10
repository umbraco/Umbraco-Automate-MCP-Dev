/**
 * Delete Workspace Group Tool
 *
 * Permanently deletes a group (folder) within a workspace. Check whether
 * any automations or child groups are filed under it first, since deleting
 * a group does not move them automatically.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace the group belongs to."),
  groupId: z.string().describe("The id of the group to delete."),
};

const deleteWorkspaceGroupTool = {
  name: "delete-workspace-group",
  description:
    "Permanently deletes a group within a workspace. This is not idempotent — calling it again on an already-deleted group returns an error. Automations and child groups filed under it are not moved or deleted automatically, so use list-workspace-groups to check for children first.",
  inputSchema,
  slices: ["delete"],
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
  },
  handler: async ({ workspaceId, groupId }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.deleteWorkspacesByIdGroupsByGroupId(
        workspaceId,
        groupId,
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(deleteWorkspaceGroupTool);
