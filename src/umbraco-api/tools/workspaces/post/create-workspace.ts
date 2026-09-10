/**
 * Create Workspace Tool
 *
 * Creates a new workspace. A workspace is the top-level container that
 * scopes a set of automations, the groups used to organize them, which
 * connections they're allowed to use, and which Umbraco user groups can
 * manage it. Uses manual response handling to extract the new workspace's
 * id from the Location header (the API returns 201 with no body).
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
  alias: z.string().min(1).describe("Unique machine alias for the workspace."),
  name: z.string().min(1).describe("Human-friendly display name for the workspace."),
  serviceAccountKey: z
    .string()
    .describe("Id of the Umbraco service account the workspace's automations run as."),
  userGroups: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Ids of the Umbraco user groups allowed to manage this workspace."),
  allowedConnections: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Ids of the connections that automations in this workspace are allowed to use."),
};

const outputSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  location: z.string().optional(),
});

const createWorkspaceTool = {
  name: "create-workspace",
  description:
    "Creates a new workspace to hold automations. A workspace is the top-level container that scopes automations, the groups (folders) used to organize them, the connections its automations may use, and which Umbraco user groups can manage it. Follow up with create-workspace-group to add folders, or automations tools to add automations to it.",
  inputSchema,
  outputSchema,
  slices: ["create"],
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
  },
  handler: async ({ alias, name, serviceAccountKey, userGroups, allowedConnections }) => {
    const client = getApiClient<ApiClient>();
    const response = (await client.postWorkspaces(
      { alias, name, serviceAccountKey, userGroups, allowedConnections },
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

export default withStandardDecorators(createWorkspaceTool);
