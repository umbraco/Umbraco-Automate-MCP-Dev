/**
 * List Catalogue Notification Channels Tool
 *
 * Lists the notification channel definitions available for sending alerts
 * or messages from an automation (e.g. email, Slack, Teams).
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getCatalogueNotificationChannelsResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getCatalogueNotificationChannelsResponse });

const listCatalogueNotificationChannelsTool = {
  name: "list-catalogue-notification-channels",
  description:
    "Lists the available notification channel definitions (e.g. email, Slack, Teams) that an automation can use to notify people. Each item's `alias` is the identifier used to reference that channel when configuring a notification step, and `settingsSchema` describes the fields required to configure it. Call this before adding a notification step to discover valid channel aliases.",
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async () => {
    return executeGetItemsApiCall<ReturnType<ApiClient["getCatalogueNotificationChannels"]>, ApiClient>(
      (client) => client.getCatalogueNotificationChannels(CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(listCatalogueNotificationChannelsTool);
