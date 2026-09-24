/**
 * Get Metrics By Automation Tool
 *
 * Returns run counts broken down per individual automation: total runs,
 * successes, and failures for each automation. Use this to compare
 * automations against each other or find which ones are failing most often.
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
  getMetricsByAutomationQueryParams,
  getMetricsByAutomationResponseItem,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({
  items: z.array(getMetricsByAutomationResponseItem),
});

const inputSchema = {
  ...getMetricsByAutomationQueryParams.shape,
  workspaceId: getMetricsByAutomationQueryParams.shape.workspaceId.describe(
    "Optional. Only count runs of automations in this workspace (id from list-workspaces).",
  ),
  from: getMetricsByAutomationQueryParams.shape.from.describe(
    "Optional start of the time window, as an ISO 8601 date-time (e.g. '2026-09-01T00:00:00Z'). Omit for no lower bound.",
  ),
  to: getMetricsByAutomationQueryParams.shape.to.describe(
    "Optional end of the time window, as an ISO 8601 date-time (e.g. '2026-09-30T23:59:59Z'). Omit for no upper bound.",
  ),
  take: getMetricsByAutomationQueryParams.shape.take.describe(
    "Maximum number of automations to return (default 10).",
  ),
};

const getMetricsByAutomationTool = {
  name: "get-metrics-by-automation",
  description:
    "Gets automation run metrics broken down per individual automation. Each item has automationId, automationName, totalRuns, successCount, and failCount, so you can compare automations or spot which ones fail most. Optionally scope to a single workspace with workspaceId, and/or restrict to runs started within [from, to] (ISO 8601 date-times) — if omitted, all recorded runs are considered. `take` limits how many automations are returned (defaults to 10) — the ordering of results is determined by the API and not otherwise documented here, so raise `take` if you need to confirm whether an automation you're looking for is included; there is no `skip`/total-count for this endpoint, so a full response cannot be distinguished from a truncated one. Use get-metrics instead when you only need one overall total rather than a per-automation list.",
  inputSchema,
  outputSchema,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ workspaceId, from, to, take }) => {
    return executeGetItemsApiCall<
      ReturnType<ApiClient["getMetricsByAutomation"]>,
      ApiClient
    >((client) =>
      client.getMetricsByAutomation(
        { workspaceId, from, to, take },
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof outputSchema
>;

export default withStandardDecorators(getMetricsByAutomationTool);
