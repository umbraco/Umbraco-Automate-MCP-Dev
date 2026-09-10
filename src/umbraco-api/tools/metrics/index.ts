/**
 * Metrics Tool Collection
 *
 * Read-only analytics/reporting tools over automation run history:
 * overall run statistics and per-automation breakdowns.
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import getMetricsTool from "./get/get-metrics.js";
import getMetricsByAutomationTool from "./get/get-metrics-by-automation.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "metrics",
    displayName: "Metrics",
    description:
      "Analytics and reporting over automation run history: overall run totals/success rate, and per-automation run counts.",
  },
  tools: () => [getMetricsTool, getMetricsByAutomationTool],
};

export default collection;
