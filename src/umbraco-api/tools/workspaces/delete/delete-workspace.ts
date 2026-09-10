/**
 * Delete Workspace Tool
 *
 * Permanently deletes a workspace, including its groups. This does not
 * automatically delete the automations that belong to it — check for
 * automations still assigned to this workspace before deleting it.
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
  workspaceId: z.string().describe("The id of the workspace to delete."),
};

const deleteWorkspaceTool = {
  name: "delete-workspace",
  description:
    "Permanently deletes a workspace and its groups. This is not idempotent — calling it again on an already-deleted workspace returns an error. Automations that belonged to this workspace are not deleted automatically, so confirm none remain assigned to it first.",
  inputSchema,
  slices: ["delete"],
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
  },
  handler: async ({ workspaceId }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.deleteWorkspacesById(workspaceId, CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(deleteWorkspaceTool);
