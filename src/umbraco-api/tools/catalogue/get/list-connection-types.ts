/**
 * List Catalogue Connection Types Tool
 *
 * Lists the connection type definitions available for creating connections
 * that automation steps can use to talk to external systems.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getCatalogueConnectionTypesResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({ items: getCatalogueConnectionTypesResponse });

const listCatalogueConnectionTypesTool = {
  name: "list-catalogue-connection-types",
  description:
    "Lists the available connection type definitions (e.g. HTTP, SMTP, Slack). Each item's `alias` identifies the connection type to use when creating a connection in the connections collection, and `settingsSchema` describes the fields required to configure that connection. Call this before creating a connection, or to check which connection type an action/trigger's `connectionTypeAlias` refers to.",
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async () => {
    return executeGetItemsApiCall<ReturnType<ApiClient["getCatalogueConnectionTypes"]>, ApiClient>(
      (client) => client.getCatalogueConnectionTypes(CAPTURE_RAW_HTTP_RESPONSE)
    );
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(listCatalogueConnectionTypesTool);
