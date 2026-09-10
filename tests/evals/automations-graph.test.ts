/**
 * Automations Graph Eval Tests
 *
 * Exercises building out an automation's trigger/step graph and running it:
 * create a workspace + automation, set a trigger, add a single step, publish,
 * manually trigger a run, then confirm a run was recorded. Runs against the
 * real Umbraco instance (see tests/evals/helpers/e2e-setup.ts).
 *
 * Real API behaviour this prompt is written around (confirmed by this
 * collection's integration tests):
 * - trigger-automation requires the automation to be Published first (a
 *   Draft/Unpublished automation is rejected with a 409).
 * - publish-automation requires the automation to already have a trigger and
 *   at least one step.
 * - "umbracoAutomate.manual" is the simplest trigger: it has no settings
 *   schema at all, so no `settings` need be passed, and it supports manual
 *   runs via trigger-automation.
 * - "umbracoAutomate.delay" is the simplest action: it takes a single
 *   `duration` setting (e.g. "00:00:05") and needs no connection fixture.
 * - Step aliases (set via add-automation-step) must be pure alphanumeric -
 *   letters and digits only, starting with a letter. No hyphens or
 *   underscores, unlike the automation's own alias.
 * - With only one step, no connect-automation-steps call is needed - a step
 *   with no incoming connection runs directly off the trigger.
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
  "set-automation-trigger",
  "add-automation-step",
  "publish-automation",
  "trigger-automation",
  "list-automation-runs",
  "delete-automation",
  "delete-workspace",
] as const;

describe("Automations Graph Workflow", () => {
  setupConsoleMock();

  const timeout = getDefaultTimeoutMs();

  it(
    "should build out a trigger/step graph, publish it, and manually trigger a run",
    runScenarioTest({
      prompt: `Complete these tasks in order. IMPORTANT: use only the tools named exactly "create-workspace", "create-automation", "set-automation-trigger", "add-automation-step", "publish-automation", "trigger-automation", "list-automation-runs", "delete-automation", "delete-workspace" (no other prefix or namespace) - do not use any tool whose name is prefixed with "mcp__umbraco__" or similar, even if it looks like it does the same thing.
1. Generate a unique suffix using the current timestamp (e.g. the numeric epoch millis).
2. Create a new workspace with alias "evalGraphWs{timestamp}" (letters/digits only), name "Eval Graph Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is the real Umbraco user id to use - do not look it up or invent another one). Leave userGroups and allowedConnections empty.
3. Create a new automation with alias "evalGraphAuto{timestamp}" (letters/digits only), name "Eval Graph Automation {timestamp}", inside the workspace you just created.
4. Set the automation's trigger to triggerAlias "umbracoAutomate.manual". This trigger has no settings schema, so omit settings entirely.
5. Add a single step to the automation with actionAlias "umbracoAutomate.delay", alias "delayStep{timestamp-digits-only}" (this alias MUST be pure alphanumeric - letters and digits only, starting with a letter, NO hyphens or underscores - strip any non-alphanumeric characters from the timestamp when building it), name "Delay Step", and settings { "duration": "00:00:05" }. Do not call connect-automation-steps - a single step with no incoming connection runs directly off the trigger, so no connection is needed.
6. Publish the automation.
7. Manually trigger the automation to start a new run.
8. List the automation's runs and confirm at least one run appears.
9. Delete the automation.
10. Delete the workspace you created in step 2.
11. Say "Graph workflow completed successfully"

Important: work entirely with real ids returned by the tools - never invent an id. If publish-automation or trigger-automation fails, check that the trigger and step were actually set/added first before retrying.`,
      tools: [...TOOLS],
      requiredTools: [
        "create-workspace",
        "create-automation",
        "set-automation-trigger",
        "add-automation-step",
        "publish-automation",
        "trigger-automation",
        "list-automation-runs",
        "delete-automation",
        "delete-workspace",
      ],
      successPattern: "Graph workflow completed successfully",
      verbose: false,
      options: {
        maxTurns: 20,
        maxBudget: 0.5,
      },
    }),
    timeout
  );
});
