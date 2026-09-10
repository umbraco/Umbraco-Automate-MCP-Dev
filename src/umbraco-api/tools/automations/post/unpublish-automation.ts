/**
 * Unpublish Automation Tool
 *
 * Takes a published automation offline: its trigger stops firing and no new
 * runs will start, but the automation, its history and its definition are
 * kept. Use publish-automation to bring it back live.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postAutomationsByIdUnpublishParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const unpublishAutomationTool = {
  name: "unpublish-automation",
  description:
    "Unpublishes an automation, taking it offline so its trigger stops firing and no new runs can start. The automation definition and run history are preserved - use publish-automation to make it live again.",
  inputSchema: postAutomationsByIdUnpublishParams.shape,
  slices: ["publish"],
  annotations: {
    idempotentHint: true,
  },
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postAutomationsByIdUnpublish(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof postAutomationsByIdUnpublishParams.shape>;

export default withStandardDecorators(unpublishAutomationTool);
