/**
 * Terminate Run Tool
 *
 * Force-stops a workflow run that has not yet reached a terminal status,
 * marking it Cancelled. This is irreversible — the run cannot be resumed or
 * replayed afterwards, only started again as a new trigger of the
 * automation.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postRunsByIdTerminateParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postRunsByIdTerminateParams.shape,
  id: postRunsByIdTerminateParams.shape.id.describe(
    "Id of the Pending, Running or Suspended run to stop.",
  ),
};

const terminateRunTool = {
  name: "terminate-run",
  description:
    "Force-stops a workflow run that is Pending, Running, or Suspended, cancelling it immediately. This is irreversible — a terminated run cannot be resumed or replayed; the automation must be triggered again to start a new run. Use suspend-run instead if you only want to pause the run temporarily.",
  inputSchema,
  slices: ["action"],
  annotations: {
    destructiveHint: true,
  },
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postRunsByIdTerminate(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, undefined>;

export default withStandardDecorators(terminateRunTool);
