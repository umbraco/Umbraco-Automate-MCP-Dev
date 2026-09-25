/**
 * Get Metrics Tool
 *
 * Returns overall run statistics across the workspace (or across all
 * workspaces the caller can see, if no workspaceId is given): total number
 * of runs, a breakdown of run counts per status, and the overall success
 * rate. Use this for a single top-level health snapshot of automation runs.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getMetricsQueryParams,
  getMetricsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

// byStatus only holds the statuses that have runs (an instance with none returns {}).
// The Umbraco 17 spec lists every status as a required key, so the generated schema
// would reject that on every instance with fewer than all seven statuses in use.
const outputSchema = getMetricsResponse.extend({
  byStatus: z.record(z.string(), z.int()),
});

const inputSchema = {
  ...getMetricsQueryParams.shape,
  workspaceId: getMetricsQueryParams.shape.workspaceId.describe(
    "Optional. Only count runs of automations in this workspace (id from list-workspaces).",
  ),
  from: getMetricsQueryParams.shape.from.describe(
    "Optional start of the time window, as an ISO 8601 date-time (e.g. '2026-09-01T00:00:00Z'). Omit for no lower bound.",
  ),
  to: getMetricsQueryParams.shape.to.describe(
    "Optional end of the time window, as an ISO 8601 date-time (e.g. '2026-09-30T23:59:59Z'). Omit for no upper bound.",
  ),
};

const getMetricsTool = {
  name: "get-metrics",
  description:
    "Gets overall automation run metrics: totalRuns, a byStatus breakdown (e.g. how many runs are Completed, Failed, Running), and successRate (successful runs / total runs). Optionally scope to a single workspace with workspaceId, and/or restrict to runs started within [from, to] (ISO 8601 date-times). If from/to are omitted, the metrics cover all recorded runs with no time restriction. Use get-metrics-by-automation instead when you need the breakdown per individual automation rather than one aggregate total.",
  inputSchema,
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ workspaceId, from, to }) => {
    return executeGetApiCall<ReturnType<ApiClient["getMetrics"]>, ApiClient>(
      (client) =>
        client.getMetrics(
          { workspaceId, from, to },
          CAPTURE_RAW_HTTP_RESPONSE,
        ),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof outputSchema
>;

export default withStandardDecorators(getMetricsTool);
