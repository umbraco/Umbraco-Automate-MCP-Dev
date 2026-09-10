/**
 * Get Metrics Tool
 *
 * Returns overall run statistics across the workspace (or across all
 * workspaces the caller can see, if no workspaceId is given): total number
 * of runs, a breakdown of run counts per status, and the overall success
 * rate. Use this for a single top-level health snapshot of automation runs.
 */

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

const getMetricsTool = {
  name: "get-metrics",
  description:
    "Gets overall automation run metrics: totalRuns, a byStatus breakdown (e.g. how many runs are Completed, Failed, Running), and successRate (successful runs / total runs). Optionally scope to a single workspace with workspaceId, and/or restrict to runs started within [from, to] (ISO 8601 date-times). If from/to are omitted, the metrics cover all recorded runs with no time restriction. Use get-metrics-by-automation instead when you need the breakdown per individual automation rather than one aggregate total.",
  inputSchema: getMetricsQueryParams.shape,
  outputSchema: getMetricsResponse,
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
  typeof getMetricsQueryParams.shape,
  typeof getMetricsResponse
>;

export default withStandardDecorators(getMetricsTool);
