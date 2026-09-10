/**
 * Create Workspace Group Tool
 *
 * Creates a new group (folder) within a workspace, used to organize the
 * automations that live inside it. Groups can be nested by passing a
 * `parentId`. Uses manual response handling to extract the new group's id
 * from the Location header (the API returns 201 with no body).
 */

import { z } from "zod";
import {
  withStandardDecorators,
  createToolResult,
  UmbracoApiError,
  CAPTURE_RAW_HTTP_RESPONSE,
  getApiClient,
  type ToolDefinition,
  type HttpResponse,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace to create the group in."),
  name: z.string().min(1).describe("Display name for the group."),
  parentId: z
    .string()
    .nullish()
    .describe("Optional id of a parent group, to nest this group underneath it. Omit for a top-level group."),
};

const outputSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  location: z.string().optional(),
});

const createWorkspaceGroupTool = {
  name: "create-workspace-group",
  description:
    "Creates a new group (folder) within a workspace to organize its automations. Pass parentId to nest it under an existing group, or omit it to create a top-level group. Use list-workspace-groups to find existing groups, and automations tools to file automations under the new group.",
  inputSchema,
  outputSchema,
  slices: ["create"],
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
  },
  handler: async ({ workspaceId, name, parentId }) => {
    const client = getApiClient<ApiClient>();
    const response = (await client.postWorkspacesByIdGroups(
      workspaceId,
      { name, parentId },
      CAPTURE_RAW_HTTP_RESPONSE
    )) as HttpResponse;

    if (response.status !== 201) {
      const errorData = response.data as Record<string, unknown> | undefined;
      throw new UmbracoApiError(
        errorData || {
          status: response.status,
          detail: response.statusText,
        }
      );
    }

    const location = response.headers?.Location || response.headers?.location;
    const id = location?.split("/").pop();

    return createToolResult({
      success: true,
      id,
      location,
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(createWorkspaceGroupTool);
