/**
 * Get Version History Supported Types Tool
 *
 * Lists the entityType values accepted by every other version-history tool
 * (list-version-history, get-version-history-entry, compare-version-history,
 * rollback-version-history). Call this first if you are not already sure
 * which entityType string to use for the entity you are working with.
 */

import {
  withStandardDecorators,
  executeGetItemsApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { getVersionHistorySupportedTypesResponseItem } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const outputSchema = z.object({
  items: z.array(getVersionHistorySupportedTypesResponseItem),
});

const getVersionHistorySupportedTypesTool = {
  name: "list-version-history-supported-types",
  description:
    "Lists the entityType strings (PascalCase, e.g. 'Automation') that the version-history tools accept. Version history is a generic versioning/audit-trail feature over entities such as automations, letting you view past versions, compare them, and roll back. Call this before list-version-history, get-version-history-entry, compare-version-history, or rollback-version-history to confirm which entityType value to pass for the entity you are inspecting.",
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  outputSchema,
  handler: async () => {
    return executeGetItemsApiCall<
      ReturnType<ApiClient["getVersionHistorySupportedTypes"]>,
      ApiClient
    >((client) =>
      client.getVersionHistorySupportedTypes(CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<undefined, typeof outputSchema>;

export default withStandardDecorators(getVersionHistorySupportedTypesTool);
