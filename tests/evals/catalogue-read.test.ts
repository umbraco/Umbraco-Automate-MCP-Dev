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
      prompt: `Complete these tasks in order. IMPORTANT: there may be two MCP servers connected with overlapping tool names — one prefixed "mcp__umbraco__" and one whose tools appear without that prefix (e.g. plain "list-catalogue-actions"). You MUST use the tool named exactly "list-catalogue-actions" and the tool named exactly "list-catalogue-triggers" — do NOT use any tool whose name starts with "mcp__umbraco__".
1. Call the tool named exactly "list-catalogue-actions" (not "mcp__umbraco__list-catalogue-actions") to list the available action step definitions for building automations.
2. Call the tool named exactly "list-catalogue-triggers" (not "mcp__umbraco__list-catalogue-triggers") to list the available trigger definitions that can start an automation.
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
