/**
 * Runs Tool Collection
 *
 * Tools for inspecting and controlling workflow run instances — one run per
 * execution of an automation. Covers listing runs, viewing step-by-step
 * execution detail, and lifecycle actions (replay, resume, suspend,
 * terminate).
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import listRunsTool from "./get/list-runs.js";
import getRunByIdTool from "./get/get-run-by-id.js";
import replayRunTool from "./post/replay-run.js";
import resumeRunTool from "./post/resume-run.js";
import suspendRunTool from "./post/suspend-run.js";
import terminateRunTool from "./post/terminate-run.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "runs",
    displayName: "Runs",
    description:
      "Inspect and control workflow run instances — list runs, view step-by-step execution detail, and replay, resume, suspend, or terminate a run.",
  },
  tools: () => [
    listRunsTool,
    getRunByIdTool,
    replayRunTool,
    resumeRunTool,
    suspendRunTool,
    terminateRunTool,
  ],
};

export default collection;
