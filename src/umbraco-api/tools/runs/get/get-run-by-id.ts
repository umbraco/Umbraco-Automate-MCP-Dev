/**
 * Get Run By Id Tool
 *
 * Returns the full detail of a single workflow run, including the
 * step-by-step execution state (stepRuns) so callers can see exactly which
 * step is running, failed, or waiting on something.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getRunsByIdParams,
  getRunsByIdResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getRunsByIdParams.shape,
  id: getRunsByIdParams.shape.id.describe(
    "Id of the run (from list-runs or list-automation-runs).",
  ),
};

const getRunByIdTool = {
  name: "get-run-by-id",
  description:
    "Gets the full detail of a single workflow run by id, including the automation it belongs to, its overall status (Pending, Running, Completed, Failed, Suspended, Cancelled, Rejected), and the step-by-step execution state (stepRuns) with each step's own status, timing, and error if any. A step in status WaitingForInput is blocked on a human decision — check list-pending-approvals (approvals collection) for the matching approval.",
  inputSchema,
  outputSchema: getRunsByIdResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    return executeGetApiCall<ReturnType<ApiClient["getRunsById"]>, ApiClient>(
      (client) => client.getRunsById(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof getRunsByIdResponse
>;

export default withStandardDecorators(getRunByIdTool);
