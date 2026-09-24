/**
 * Automations CRUD Eval Tests
 *
 * Exercises the basic lifecycle of an automation: create the workspace it
 * lives in, create the automation itself, list/get it back, update its
 * metadata (name/description only - no trigger/steps involved), then clean
 * up. Runs against the real Umbraco instance (see tests/evals/helpers/e2e-setup.ts).
 */

import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
  getDefaultTimeoutMs,
} from "@umbraco-cms/mcp-server-sdk/evals";

const TOOLS = [
  "create-workspace",
  "create-automation",
  "list-automations",
  "get-automation",
  "update-automation",
  "delete-automation",
  "delete-workspace",
] as const;

describe("Automations CRUD Operations", () => {
  setupConsoleMock();

  const timeout = getDefaultTimeoutMs();

  it(
    "should complete a full create-read-update-delete workflow for an automation",
    runScenarioTest({
      prompt: `Complete these tasks in order.
1. Generate a unique suffix using the current timestamp (e.g. the numeric epoch millis).
2. Create a new workspace with alias "evalWs{timestamp}", name "Eval Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is the real Umbraco user id to use - do not look it up or invent another one). Leave userGroups and allowedConnections empty.
3. Create a new automation with alias "evalAuto{timestamp}", name "Eval Automation {timestamp}", description "Created by eval test", inside the workspace you just created (use its workspaceId from step 2).
4. List automations filtering by that alias to confirm it appears in the results.
5. Get the automation by its id to verify its details (it should have no trigger and no steps yet - that's expected).
6. Update the automation: change its name to "Updated Eval Automation {timestamp}" and its description to "Updated by eval test". Do not touch its trigger or steps.
7. Get the automation again to confirm the name and description were updated.
8. Delete the automation.
9. Delete the workspace you created in step 2.
10. Say "CRUD workflow completed successfully"

Important: work entirely with real ids returned by the tools - never invent an id. If a tool call fails, report the error rather than guessing a fix.`,
      tools: [...TOOLS],
      requiredTools: [
        "create-workspace",
        "create-automation",
        "list-automations",
        "get-automation",
        "update-automation",
        "delete-automation",
        "delete-workspace",
      ],
      successPattern: "CRUD workflow completed successfully",
      verbose: false,
    }),
    timeout
  );
});
