/**
 * Suspend Run Tool
 *
 * Pauses a workflow run that is currently in progress (Pending or Running),
 * leaving it in a Suspended state that can later be continued with
 * resume-run.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postRunsByIdSuspendParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const suspendRunTool = {
  name: "suspend-run",
  description:
    "Pauses a workflow run that is currently in progress (status Pending or Running), leaving it Suspended so it can be continued later with resume-run instead of running to completion. Not valid for a run that has already finished or been terminated — check status via get-run-by-id first.",
  inputSchema: postRunsByIdSuspendParams.shape,
  slices: ["action"],
  annotations: {},
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postRunsByIdSuspend(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof postRunsByIdSuspendParams.shape, undefined>;

export default withStandardDecorators(suspendRunTool);
