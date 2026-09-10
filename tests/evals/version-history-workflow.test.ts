import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
} from "@umbraco-cms/mcp-server-sdk/evals";

// This eval lives under "version-history" but needs the workspaces/automations tools too:
// version history only accumulates real entries as a side effect of real edits to a
// versioned entity (an automation). Mirrors the real, already-verified sequence used by
// src/umbraco-api/tools/version-history/__tests__/compare-version-history.test.ts and
// rollback-version-history.test.ts - creating an automation is version 1, and each
// subsequent save (add-automation-step, update-automation, set-automation-trigger) creates a
// new version, giving real version numbers to list/compare/roll back between.
const WORKSPACE_TOOLS = ["create-workspace", "delete-workspace"] as const;
const AUTOMATION_TOOLS = [
  "create-automation",
  "add-automation-step",
  "update-automation",
  "set-automation-trigger",
  "get-automation",
  "delete-automation",
] as const;
const VERSION_HISTORY_TOOLS = [
  "list-version-history-supported-types",
  "list-version-history",
  "get-version-history-entry",
  "compare-version-history",
  "rollback-version-history",
] as const;

describe("Version History Workflow", () => {
  setupConsoleMock();

  it(
    "should accumulate real versions of an automation, compare them, and roll back",
    runScenarioTest({
      prompt: `IMPORTANT: You may see two sets of tools with the same names but different prefixes (e.g. "mcp__my-umbraco-mcp__create-workspace" and "mcp__umbraco__create-workspace"). Always call the ones prefixed "mcp__my-umbraco-mcp__" - never call any tool prefixed "mcp__umbraco__".

Complete these tasks in order:
1. Generate a unique identifier using the current timestamp (call it {timestamp}).
2. Create a new workspace with alias "eval-ws-verhist-{timestamp}", name "Eval VerHist Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is a real Umbraco user id already known to be valid on this instance - use it exactly as given). Note its id.
3. Create a new automation in that workspace with alias "eval-automation-verhist-{timestamp}" and name "Eval VerHist Automation {timestamp}" (remember this exact original name - you will need it later). Note its id. This creation is version 1 of the automation.
4. Add a step to the automation: actionAlias "umbracoAutomate.delay", alias "delayStep", name "Delay Step", and settings { "duration": "00:00:05" }. Leave all other optional fields unset. This creates a new version.
5. Update the automation: change only its name to "Eval VerHist Automation {timestamp} Renamed" (leave alias, description, and groupId unchanged/omitted). This creates another new version.
6. Set the automation's trigger to triggerAlias "umbracoAutomate.manual" with no settings. This creates another new version.
7. Call list-version-history-supported-types and confirm "Automation" is one of the supported entityType values.
8. Call list-version-history with entityType "Automation" and entityId set to the automation's id. Note the currentVersion number and the list of version numbers returned (version 1 should be the original creation).
9. Call get-version-history-entry with entityType "Automation", entityId the automation's id, and entityVersion 1. Confirm it represents the automation's creation.
10. Call compare-version-history with entityType "Automation", entityId the automation's id, fromEntityVersion 1, and toEntityVersion equal to the currentVersion you noted in step 8. Confirm the diff shows the name change.
11. Call rollback-version-history with entityType "Automation", entityId the automation's id, and entityVersion 1.
12. Call get-automation for the automation's id and confirm its name is back to the original "Eval VerHist Automation {timestamp}" (not the renamed version).
13. Clean up: delete the automation by its id, then delete the workspace by its id.
14. Say "Version history workflow completed successfully"`,
      tools: [...WORKSPACE_TOOLS, ...AUTOMATION_TOOLS, ...VERSION_HISTORY_TOOLS],
      requiredTools: [
        "create-workspace",
        "create-automation",
        "add-automation-step",
        "update-automation",
        "set-automation-trigger",
        "list-version-history-supported-types",
        "list-version-history",
        "get-version-history-entry",
        "compare-version-history",
        "rollback-version-history",
        "get-automation",
        "delete-automation",
        "delete-workspace",
      ],
      successPattern: "Version history workflow completed successfully",
      options: {
        maxTurns: 25,
        maxBudget: 0.75,
      },
      verbose: false,
    }),
    150000
  );
});
