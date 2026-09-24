/**
 * Get Automation Webhook URL Tool
 *
 * Returns the inbound webhook URL for an automation that is triggered by an
 * incoming HTTP request. Only meaningful for automations whose trigger is
 * webhook-based - give this URL to the external system that should call it.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsByIdWebhookUrlParams,
  getAutomationsByIdWebhookUrlResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getAutomationsByIdWebhookUrlParams.shape,
  id: getAutomationsByIdWebhookUrlParams.shape.id.describe(
    "Id of the automation (from list-automations or create-automation).",
  ),
};

const getAutomationWebhookUrlTool = {
  name: "get-automation-webhook-url",
  description:
    "Gets the inbound webhook URL for an automation whose trigger is webhook-based. Share this URL with the external system that should invoke the automation. For automations with a different trigger type, this endpoint is not meaningful.",
  inputSchema,
  outputSchema: getAutomationsByIdWebhookUrlResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["getAutomationsByIdWebhookUrl"]>,
      ApiClient
    >((client) => client.getAutomationsByIdWebhookUrl(id, CAPTURE_RAW_HTTP_RESPONSE));
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  typeof getAutomationsByIdWebhookUrlResponse
>;

export default withStandardDecorators(getAutomationWebhookUrlTool);
