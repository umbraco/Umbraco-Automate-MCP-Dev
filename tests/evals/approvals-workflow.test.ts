import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
} from "@umbraco-cms/mcp-server-sdk/evals";

// This eval lives under "approvals" but needs the workspaces/automations tools too: a
// pending approval only exists as a side effect of a real automation run pausing on an
// approval step (approvals has no create tool of its own). Mirrors the real,
// already-verified sequence used by
// src/umbraco-api/tools/approvals/__tests__/decide-approval-step.test.ts - a manual trigger
// plus a single umbracoAutomate.requestApproval step reliably pauses the run in
// WaitingForInput, which list-pending-approvals surfaces.
const WORKSPACE_TOOLS = ["create-workspace", "delete-workspace"] as const;
const AUTOMATION_TOOLS = [
  "create-automation",
  "set-automation-trigger",
  "add-automation-step",
  "publish-automation",
  "trigger-automation",
  "unpublish-automation",
  "delete-automation",
] as const;
const APPROVAL_TOOLS = ["list-pending-approvals", "decide-approval-step"] as const;

describe("Approvals Workflow", () => {
  setupConsoleMock();

  it(
    "should trigger a run that pauses for approval and approve it",
    runScenarioTest({
      prompt: `IMPORTANT: You may see two sets of tools with the same names but different prefixes (e.g. "mcp__my-umbraco-mcp__create-workspace" and "mcp__umbraco__create-workspace"). Always call the ones prefixed "mcp__my-umbraco-mcp__" - never call any tool prefixed "mcp__umbraco__".

Complete these tasks in order:
1. Generate a unique identifier using the current timestamp (call it {timestamp}).
2. Create a new workspace with alias "eval-ws-approvals-{timestamp}", name "Eval Approvals Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is a real Umbraco user id already known to be valid on this instance - use it exactly as given). Note its id.
3. Create a new automation in that workspace with alias "eval-automation-approvals-{timestamp}" and name "Eval Approvals Automation {timestamp}". Note its id.
4. Set the automation's trigger to triggerAlias "umbracoAutomate.manual" with no settings (this trigger has no settings schema).
5. Add a step to the automation: actionAlias "umbracoAutomate.requestApproval", alias "approvalStep", name "Approval Step", and settings { "prompt": "Approve this eval test run?" }. Leave all other optional fields unset.
6. Publish the automation.
7. Trigger the automation to start a new run.
8. Call list-pending-approvals and look for an item whose automation matches the one you created. The run may take a moment to reach the approval step, so if you don't see a matching item yet, wait about 1 second and call list-pending-approvals again. Repeat this up to 5 times before giving up. Once found, note its runId and stepId.
9. Call decide-approval-step with that runId and stepId, outcome "Approved", and comment "Approved by eval test".
10. Clean up: call unpublish-automation on the automation (ignore any error if it is already unpublished), then delete the automation by its id, then delete the workspace by its id.
11. Say "Approvals workflow completed successfully"`,
      tools: [...WORKSPACE_TOOLS, ...AUTOMATION_TOOLS, ...APPROVAL_TOOLS],
      requiredTools: [
        "create-workspace",
        "create-automation",
        "set-automation-trigger",
        "add-automation-step",
        "publish-automation",
        "trigger-automation",
        "list-pending-approvals",
        "decide-approval-step",
        "delete-automation",
        "delete-workspace",
      ],
      successPattern: "Approvals workflow completed successfully",
      options: {
        maxTurns: 25,
        maxBudget: 0.75,
      },
      verbose: false,
    }),
    150000
  );
});
