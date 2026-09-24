/**
 * Re-enable Automation Tool
 *
 * Re-enables an automation that Umbraco auto-disabled after repeated run
 * failures (health = Disabled), letting its trigger fire again. Investigate
 * and fix the underlying cause (see list-automation-runs) before re-enabling,
 * or it may just get disabled again.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postAutomationsByIdReEnableParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postAutomationsByIdReEnableParams.shape,
  id: postAutomationsByIdReEnableParams.shape.id.describe(
    "Id of the automation to re-enable.",
  ),
};

const reEnableAutomationTool = {
  name: "re-enable-automation",
  description:
    "Re-enables an automation that was automatically disabled by Umbraco after repeated failures (health = Disabled), allowing its trigger to fire again. Check list-automation-runs first to understand why it was disabled - re-enabling without fixing the cause will likely lead to it being disabled again.",
  inputSchema,
  slices: ["action"],
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postAutomationsByIdReEnable(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(reEnableAutomationTool);
