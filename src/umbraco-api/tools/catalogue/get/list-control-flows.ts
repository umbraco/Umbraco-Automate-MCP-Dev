/**
 * List Catalogue Control Flows Tool
 *
 * Lists the control-flow step definitions (e.g. branch, loop) available
 * for structuring an automation's logic.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getCatalogueControlFlowsResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getCatalogueControlFlowsResponse });

const listCatalogueControlFlowsTool = {
  name: "list-catalogue-control-flows",
  description:
    "Lists the available control-flow step definitions (e.g. branch/condition, loop) that can be added to an automation to direct or repeat execution. Each item's `alias` is the identifier used to reference that control-flow construct when adding a step to an automation in the automations collection, and `settingsSchema` describes the fields needed to configure it. Call this before adding a control-flow step to discover valid aliases.",
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async () => {
    return executeGetItemsApiCall<ReturnType<ApiClient["getCatalogueControlFlows"]>, ApiClient>(
      (client) => client.getCatalogueControlFlows(CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(listCatalogueControlFlowsTool);
