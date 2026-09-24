import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
  getDefaultTimeoutMs,
} from "@umbraco-cms/mcp-server-sdk/evals";

const METRICS_TOOLS = ["get-metrics", "get-metrics-by-automation"] as const;

describe("Metrics Read-Only Workflow", () => {
  setupConsoleMock();
  const timeout = getDefaultTimeoutMs();

  it(
    "should get overall metrics and per-automation metrics and report the real totalRuns figure",
    runScenarioTest({
      prompt: `Complete these tasks in order.
1. Call "get-metrics" to get overall automation run metrics (do not pass a workspaceId, from, or to - you want the totals across everything recorded).
2. Call "get-metrics-by-automation" to get automation run metrics broken down per individual automation (again with no filters).
3. Read the "totalRuns" value from the overall metrics result. Whatever number it is (including zero), that is correct - do not assume or guess a value, only report the real number returned by the tool.
4. Report back in this exact format: "METRICS READ CHECK: totalRuns=<number>"`,
      tools: [...METRICS_TOOLS],
      requiredTools: [...METRICS_TOOLS],
      successPattern: "METRICS READ CHECK:",
      verbose: false,
    }),
    timeout
  );
});
