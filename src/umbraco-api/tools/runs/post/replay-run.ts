/**
 * Replay Run Tool
 *
 * Re-executes a finished workflow run from the start as a brand new run.
 * Only valid once a run has reached a terminal status — Completed, Failed,
 * Cancelled, or Rejected. Use resume-run instead if the run is Suspended.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postRunsByIdReplayParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postRunsByIdReplayParams.shape,
  id: postRunsByIdReplayParams.shape.id.describe(
    "Id of the finished run to replay.",
  ),
};

const replayRunTool = {
  name: "replay-run",
  description:
    "Re-executes a finished workflow run from the start, creating a new run against the same automation. Only valid once the run has reached a terminal status (Completed, Failed, Cancelled, or Rejected) — check status via get-run-by-id first. For a run that is Suspended, use resume-run instead.",
  inputSchema,
  slices: ["action"],
  annotations: {},
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postRunsByIdReplay(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, undefined>;

export default withStandardDecorators(replayRunTool);
