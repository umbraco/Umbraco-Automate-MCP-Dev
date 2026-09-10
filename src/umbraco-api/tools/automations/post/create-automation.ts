/**
 * Create Automation Tool
 *
 * Creates a new, empty draft automation (no trigger, steps or connections
 * yet) inside a workspace. The automation is created in Draft status and is
 * not live until publish-automation is called. Build out the trigger and
 * step graph afterwards with set-automation-trigger, add-automation-step,
 * and connect-automation-steps - this tool only reserves the
 * alias/name/id.
 */

import {
  withStandardDecorators,
  createToolResult,
  getApiClient,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
  type HttpResponse,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import type { CreateAutomationRequestModel } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  alias: z
    .string()
    .min(1)
    .describe("Unique, code-friendly alias for the automation (e.g. 'notify-on-publish')."),
  name: z.string().min(1).describe("Human-readable display name."),
  description: z
    .string()
    .optional()
    .describe("Optional description of what this automation does."),
  workspaceId: z
    .string()
    .uuid()
    .describe(
      "Id of the workspace this automation belongs to. Not validated against existing workspaces at creation time (verified against the live API) - pass an id from list-workspaces/get-workspace to avoid creating an automation under a workspace that doesn't exist."
    ),
  groupId: z
    .string()
    .uuid()
    .optional()
    .describe("Optional id of the workspace group (folder) to create the automation in."),
};

type CreateAutomationParams = {
  alias: string;
  name: string;
  description?: string;
  workspaceId: string;
  groupId?: string;
};

const outputSchema = z.object({
  message: z.string(),
  id: z.string().uuid(),
});

const createAutomationTool = {
  name: "create-automation",
  description:
    "Creates a new draft automation with no trigger, steps or connections yet - just alias, name, description and workspace/group placement. The automation starts in Draft status and has no effect until it has a trigger and steps configured and publish-automation is called. Follow up with set-automation-trigger, then add-automation-step and connect-automation-steps to build out the graph.",
  inputSchema,
  outputSchema,
  slices: ["create"],
  handler: async (model: CreateAutomationParams) => {
    const client = getApiClient<ApiClient>();

    const body: CreateAutomationRequestModel = {
      alias: model.alias,
      name: model.name,
      description: model.description ?? null,
      workspaceId: model.workspaceId,
      groupId: model.groupId ?? null,
      trigger: null,
      steps: [],
      connections: [],
      canvasState: null,
      notificationSettings: null,
    };

    const response = (await client.postAutomations(
      body,
      CAPTURE_RAW_HTTP_RESPONSE,
    )) as unknown as HttpResponse;

    const locationHeader =
      response.headers?.location || response.headers?.Location;
    if (!locationHeader) {
      throw new Error(
        "No Location header in response - cannot determine created automation ID",
      );
    }

    const idMatch = locationHeader.match(/\/([a-f0-9-]{36})$/i);
    if (!idMatch) {
      throw new Error(
        `Could not extract ID from Location header: ${locationHeader}`,
      );
    }

    return createToolResult({
      message: `Automation "${model.name}" created successfully`,
      id: idMatch[1],
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(createAutomationTool);
