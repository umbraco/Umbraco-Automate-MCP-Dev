/**
 * Update Workspace Tool
 *
 * Updates an existing workspace's alias, name, service account, allowed
 * user groups, and allowed connections. Requires the current `version`
 * (from get-workspace or list-workspaces) for optimistic concurrency — the
 * update is rejected if the workspace has changed since that version was
 * read.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { putWorkspacesByIdBody } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace to update."),
  ...putWorkspacesByIdBody.shape,
};

const updateWorkspaceTool = {
  name: "update-workspace",
  description:
    "Updates an existing workspace's alias, name, service account, allowed user groups, and allowed connections. Requires the current `version` returned by get-workspace or list-workspaces — the call fails if the workspace has been modified since, so fetch it fresh right before updating.",
  inputSchema,
  slices: ["update"],
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
  },
  handler: async ({
    workspaceId,
    alias,
    name,
    serviceAccountKey,
    userGroups,
    allowedConnections,
    version,
  }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.putWorkspacesById(
        workspaceId,
        { alias, name, serviceAccountKey, userGroups, allowedConnections, version },
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(updateWorkspaceTool);
