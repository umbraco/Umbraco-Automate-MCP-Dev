/**
 * Update Workspace Group Tool
 *
 * Renames a group within a workspace and/or changes its parent group,
 * letting you re-nest a group elsewhere in the workspace's folder
 * hierarchy.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { putWorkspacesByIdGroupsByGroupIdBody } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace the group belongs to."),
  groupId: z.string().describe("The id of the group to update."),
  ...putWorkspacesByIdGroupsByGroupIdBody.shape,
};

const updateWorkspaceGroupTool = {
  name: "update-workspace-group",
  description:
    "Renames a group within a workspace and/or moves it under a different parent group. Pass parentId to re-nest the group, or omit it to make/keep it a top-level group. Use list-workspace-groups or get-workspace-group to find the current name and parentId first.",
  inputSchema,
  slices: ["update"],
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
  },
  handler: async ({ workspaceId, groupId, name, parentId }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.putWorkspacesByIdGroupsByGroupId(
        workspaceId,
        groupId,
        { name, parentId },
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(updateWorkspaceGroupTool);
