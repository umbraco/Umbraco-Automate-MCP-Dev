import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
} from "@umbraco-cms/mcp-server-sdk/evals";

// This eval lives under "runs" but needs the workspaces/automations tools too: a run only
// comes into existence by triggering a real, published automation (there is no create-run
// tool). Mirrors the real, already-verified sequence used by
// src/umbraco-api/tools/runs/__tests__/helpers/run-fixture.ts - a manual trigger plus a
// single long-enough umbracoAutomate.delay step keeps the run's status "Running" for a real
// window, giving suspend-run/resume-run/terminate-run genuine state transitions to act on
// instead of just precondition errors.
const WORKSPACE_TOOLS = ["create-workspace", "delete-workspace"] as const;
const AUTOMATION_TOOLS = [
  "create-automation",
  "set-automation-trigger",
  "add-automation-step",
  "publish-automation",
  "trigger-automation",
  "list-automation-runs",
  "delete-automation",
] as const;
const RUN_TOOLS = [
  "get-run-by-id",
  "suspend-run",
  "resume-run",
  "terminate-run",
] as const;

describe("Runs Lifecycle", () => {
  setupConsoleMock();

  it(
    "should trigger a run and drive it through suspend, resume, and terminate",
    runScenarioTest({
      prompt: `IMPORTANT: You may see two sets of tools with the same names but different prefixes (e.g. "mcp__my-umbraco-mcp__create-workspace" and "mcp__umbraco__create-workspace"). Always call the ones prefixed "mcp__my-umbraco-mcp__" - never call any tool prefixed "mcp__umbraco__".

Complete these tasks in order:
1. Generate a unique identifier using the current timestamp (call it {timestamp}).
2. Create a new workspace with alias "eval-ws-runs-{timestamp}", name "Eval Runs Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is a real Umbraco user id already known to be valid on this instance - use it exactly as given). Note its id.
3. Create a new automation in that workspace with alias "eval-automation-runs-{timestamp}" and name "Eval Runs Automation {timestamp}". Note its id.
4. Set the automation's trigger to triggerAlias "umbracoAutomate.manual" with no settings (this trigger has no settings schema).
5. Add a step to the automation: actionAlias "umbracoAutomate.delay", alias "delayStep", name "Delay Step", and settings { "duration": "00:00:20" } (a 20 second delay). Leave all other optional fields unset.
6. Publish the automation.
7. Trigger the automation to start a new run.
8. Call list-automation-runs for the automation and note the id of the run you just started (it should be the most recent one). Then call get-run-by-id for that run and confirm its status is "Running" (if it is not yet "Running", wait briefly and check again - the delay step keeps it "Running" for the full 20 seconds).
9. Call suspend-run on that run id. Then call get-run-by-id again and confirm the status is now "Suspended".
10. Call resume-run on that same run id to continue it.
11. Call terminate-run on that same run id to force-stop it for good (this is expected to succeed whether the run is still Running/Suspended after resuming, or has already completed the short remaining delay - if terminate-run returns an error because the run already reached a terminal status like Completed, that is fine, just note it and continue).
12. Clean up: delete the automation by its id, then delete the workspace by its id.
13. Say "Runs lifecycle workflow completed successfully"`,
      tools: [...WORKSPACE_TOOLS, ...AUTOMATION_TOOLS, ...RUN_TOOLS],
      requiredTools: [
        "create-workspace",
        "create-automation",
        "set-automation-trigger",
        "add-automation-step",
        "publish-automation",
        "trigger-automation",
        "get-run-by-id",
        "suspend-run",
        "resume-run",
        "terminate-run",
        "delete-automation",
        "delete-workspace",
      ],
      successPattern: "Runs lifecycle workflow completed successfully",
      options: {
        maxTurns: 25,
        maxBudget: 0.75,
      },
      verbose: false,
    }),
    150000
  );
});
