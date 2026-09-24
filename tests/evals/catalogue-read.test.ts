import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
  getDefaultTimeoutMs,
} from "@umbraco-cms/mcp-server-sdk/evals";

const CATALOGUE_TOOLS = [
  "list-catalogue-actions",
  "list-catalogue-triggers",
] as const;

describe("Catalogue Read-Only Workflow", () => {
  setupConsoleMock();
  const timeout = getDefaultTimeoutMs();

  it(
    "should list catalogue actions and triggers and report real facts from the results",
    runScenarioTest({
      prompt: `Complete these tasks in order.
1. Call "list-catalogue-actions" to list the available action step definitions for building automations.
2. Call "list-catalogue-triggers" to list the available trigger definitions that can start an automation.
3. Count exactly how many trigger definitions were returned, and name the "alias" of exactly one action definition from the first result.
4. Report back in this exact format: "CATALOGUE READ CHECK: <number> triggers found; example action alias: <alias>"`,
      tools: [...CATALOGUE_TOOLS],
      requiredTools: [...CATALOGUE_TOOLS],
      successPattern: "CATALOGUE READ CHECK:",
      verbose: false,
    }),
    timeout
  );
});
