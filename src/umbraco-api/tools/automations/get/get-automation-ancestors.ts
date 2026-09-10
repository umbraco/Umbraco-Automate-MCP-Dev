/**
 * Get Automation Ancestors Tool
 *
 * Lists the folder/group ancestry of an automation, from its immediate parent
 * up to the workspace root. Use this to show breadcrumbs or to find the
 * groupId chain above an automation.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsByIdAncestorsParams,
  getAutomationsByIdAncestorsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getAutomationsByIdAncestorsResponse });

const getAutomationAncestorsTool = {
  name: "get-automation-ancestors",
  description:
    "Lists the ancestor entities (workspace groups/folders) above an automation, ordered from the immediate parent up to the root. Use this to build breadcrumbs or to discover the groupId hierarchy an automation lives in.",
  inputSchema: getAutomationsByIdAncestorsParams.shape,
  outputSchema,
  slices: ["tree"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    return executeGetItemsApiCall<
      ReturnType<ApiClient["getAutomationsByIdAncestors"]>,
      ApiClient
    >((client) => client.getAutomationsByIdAncestors(id, CAPTURE_RAW_HTTP_RESPONSE));
  },
} satisfies ToolDefinition<typeof getAutomationsByIdAncestorsParams.shape, typeof outputSchema>;

export default withStandardDecorators(getAutomationAncestorsTool);
