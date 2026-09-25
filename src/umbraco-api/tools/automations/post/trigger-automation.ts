/**
 * Trigger Automation Tool
 *
 * Manually starts a new run of an automation right now, bypassing its normal
 * trigger condition. Has a real side effect: it executes the automation's
 * steps immediately. Use list-automation-runs afterwards to check the
 * outcome. The automation must be published first (verified against the
 * live API) - publish-automation before calling this on a Draft automation.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postAutomationsByIdTriggerParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postAutomationsByIdTriggerParams.shape,
  id: postAutomationsByIdTriggerParams.shape.id.describe(
    "Id of the published automation to run now.",
  ),
};

const triggerAutomationTool = {
  name: "trigger-automation",
  description:
    "Manually starts a new run of an automation immediately, bypassing its configured trigger condition. The automation must be published first (publish-automation) - this fails on a Draft or Unpublished automation. Has a real side effect - it executes the automation's steps right now. Use list-automation-runs afterwards to see the resulting run and its outcome.",
  inputSchema,
  slices: ["action"],
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postAutomationsByIdTrigger(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema>;

export default withStandardDecorators(triggerAutomationTool);
