/**
 * Decide Approval Step Tool
 *
 * Submits a human approve/reject decision for a workflow run step that is
 * currently paused waiting for approval.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  postApprovalsByRunIdStepsByStepIdDecisionParams,
  postApprovalsByRunIdStepsByStepIdDecisionBody,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  runId: postApprovalsByRunIdStepsByStepIdDecisionParams.shape.runId.describe(
    "ID of the paused workflow run, from list-pending-approvals.",
  ),
  stepId: postApprovalsByRunIdStepsByStepIdDecisionParams.shape.stepId.describe(
    "ID of the pending approval step within the run, from list-pending-approvals.",
  ),
  outcome: postApprovalsByRunIdStepsByStepIdDecisionBody.shape.outcome.describe(
    "The decision: 'Approved' resumes the run past this step, 'Rejected' fails the run at this step.",
  ),
  comment: postApprovalsByRunIdStepsByStepIdDecisionBody.shape.comment.describe(
    "Optional free-text reason or note to record alongside the decision.",
  ),
};

const DecideApprovalStepTool = {
  name: "decide-approval-step",
  description:
    "Submits a human approve/reject decision for a workflow run step that is currently " +
    "paused waiting for approval. Get the runId and stepId from list-pending-approvals — " +
    "only steps returned by that tool are valid targets. Setting outcome to 'Approved' " +
    "unblocks the run so it continues past this step; 'Rejected' fails the run at this " +
    "step. Not idempotent — a step can only be decided once, so calling this again for a " +
    "step that has already been decided will error rather than silently succeed.",
  inputSchema,
  slices: ["action"],
  annotations: {
    idempotentHint: false,
  },
  handler: async ({ runId, stepId, outcome, comment }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postApprovalsByRunIdStepsByStepIdDecision(
        runId,
        stepId,
        { outcome, comment },
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(DecideApprovalStepTool);
