/**
 * List Pending Approvals Tool
 *
 * Lists all workflow run steps that are currently waiting on a human
 * approve/reject decision, across every automation the caller can see.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getApprovalsPendingResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getApprovalsPendingResponse });

const listPendingApprovalsTool = {
  name: "list-pending-approvals",
  description:
    "Lists workflow run steps that are currently paused and waiting for a human approve/reject decision. Each item includes the runId and stepId needed to submit a decision, plus the automation it belongs to and the prompt shown to the approver. Use this to find what is blocked on approval before calling decide-approval-step.",
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  outputSchema,
  handler: async () => {
    return executeGetItemsApiCall<
      ReturnType<ApiClient["getApprovalsPending"]>,
      ApiClient
    >((client) => client.getApprovalsPending(CAPTURE_RAW_HTTP_RESPONSE));
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(listPendingApprovalsTool);
