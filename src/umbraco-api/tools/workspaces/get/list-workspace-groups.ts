/**
 * List Workspace Groups Tool
 *
 * Lists the groups (folders) a workspace uses to organize its automations.
 * Groups can be nested via `parentId`. This only returns one level at a
 * time: omit `parentGroupId` to list the workspace's top-level groups, or
 * pass a group id to list that group's direct children - it does not
 * recursively return every nested group in one call. Once you have a group
 * id, use `automations/groups/{groupId}` tools (in the automations
 * collection) to list the automations filed under it.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getWorkspacesByIdGroupsResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: z.string().describe("The id of the workspace whose groups to list."),
  parentGroupId: z
    .string()
    .optional()
    .describe(
      "Optional parent group id. When set, returns only that group's direct children. When omitted, returns only the workspace's top-level groups (those with no parent) - not every group in the workspace. To see all groups, walk the tree: list top-level groups, then call this again with each group's id to list its children, recursively."
    ),
};
const outputSchema = z.object({ items: getWorkspacesByIdGroupsResponse });

const listWorkspaceGroupsTool = {
  name: "list-workspace-groups",
  description:
    "Lists one level of the groups a workspace uses to organize its automations: either the top-level groups (parentGroupId omitted) or the direct children of one group (parentGroupId set). This does not recursively return nested groups in a single call - call it again with a child group's id to go one level deeper. Each item includes the group id, name, parentId (for nesting) and workspaceId. Use get-workspace-group for a single group, or automations tools to see the automations filed under a group.",
  inputSchema,
  outputSchema,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ workspaceId, parentGroupId }) => {
    return executeGetItemsApiCall<
      ReturnType<ApiClient["getWorkspacesByIdGroups"]>,
      ApiClient
    >((client) =>
      client.getWorkspacesByIdGroups(
        workspaceId,
        { parentGroupId },
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(listWorkspaceGroupsTool);
