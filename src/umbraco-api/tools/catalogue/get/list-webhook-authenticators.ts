/**
 * List Catalogue Webhook Authenticators Tool
 *
 * Lists the webhook authenticator definitions available for securing
 * inbound webhook triggers.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getCatalogueWebhookAuthenticatorsResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getCatalogueWebhookAuthenticatorsResponse });

const listCatalogueWebhookAuthenticatorsTool = {
  name: "list-catalogue-webhook-authenticators",
  description:
    "Lists the available webhook authenticator definitions (e.g. shared secret, signature verification) that can secure an inbound webhook trigger. Each item's `alias` is the identifier used to reference that authenticator when configuring a webhook trigger, and `settingsSchema` describes the fields required to configure it. Call this before configuring a webhook-triggered automation to discover valid authenticator aliases.",
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async () => {
    return executeGetItemsApiCall<ReturnType<ApiClient["getCatalogueWebhookAuthenticators"]>, ApiClient>(
      (client) => client.getCatalogueWebhookAuthenticators(CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(listCatalogueWebhookAuthenticatorsTool);
