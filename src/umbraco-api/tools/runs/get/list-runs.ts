/**
 * List Runs Tool
 *
 * Lists workflow run instances across all automations, newest first, with
 * simple skip/take paging. Each run belongs to an automation in the
 * "automations" collection and reports its own lifecycle status.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getRunsQueryParams,
  getRunsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const listRunsTool = {
  name: "list-runs",
  description:
    "Lists workflow run instances across all automations, most recent first, with skip/take paging. Each item reports its lifecycle status (Pending, Running, Completed, Failed, Suspended, Cancelled, Rejected) plus the automation it belongs to. Use get-run-by-id for full step-by-step detail on a specific run, and list-pending-approvals (approvals collection) to see which runs are currently blocked waiting on a human decision.",
  inputSchema: getRunsQueryParams.shape,
  outputSchema: getRunsResponse,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ skip, take }) => {
    return executeGetApiCall<ReturnType<ApiClient["getRuns"]>, ApiClient>(
      (client) => client.getRuns({ skip, take }, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<
  typeof getRunsQueryParams.shape,
  typeof getRunsResponse
>;

export default withStandardDecorators(listRunsTool);
