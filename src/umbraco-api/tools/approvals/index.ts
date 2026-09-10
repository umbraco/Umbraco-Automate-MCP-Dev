/**
 * Approvals Tool Collection
 *
 * Tools for finding and deciding workflow run steps that are paused waiting
 * on a human approve/reject decision.
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import listPendingApprovalsTool from "./get/list-pending-approvals.js";
import decideApprovalStepTool from "./post/decide-approval-step.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "approvals",
    displayName: "Approvals",
    description:
      "Find workflow run steps paused waiting for human approval, and submit approve/reject decisions to unblock or fail them.",
  },
  tools: () => [listPendingApprovalsTool, decideApprovalStepTool],
};

export default collection;
