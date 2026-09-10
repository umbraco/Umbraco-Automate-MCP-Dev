/**
 * Get Version History Entry Tool
 *
 * Gets the snapshot metadata for one specific past version of an entity.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getVersionHistoryByEntityTypeByEntityIdByEntityVersionParams,
  getVersionHistoryByEntityTypeByEntityIdByEntityVersionResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const getVersionHistoryEntryTool = {
  name: "get-version-history-entry",
  description:
    "Gets one specific past version of an entity, identified by entityType, entityId, and entityVersion. Returns that version's id, version number, dateCreated, createdByUserId, changeDescription, and whether it isPublished. Use list-version-history first to find valid entityVersion numbers for the entity. Use get-version-history-supported-types to confirm a valid entityType (PascalCase, e.g. 'Automation' - see list-version-history-supported-types for the full list).",
  inputSchema: getVersionHistoryByEntityTypeByEntityIdByEntityVersionParams.shape,
  outputSchema: getVersionHistoryByEntityTypeByEntityIdByEntityVersionResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ entityType, entityId, entityVersion }) => {
    return executeGetApiCall<
      ReturnType<
        ApiClient["getVersionHistoryByEntityTypeByEntityIdByEntityVersion"]
      >,
      ApiClient
    >((client) =>
      client.getVersionHistoryByEntityTypeByEntityIdByEntityVersion(
        entityType,
        entityId,
        entityVersion,
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<
  typeof getVersionHistoryByEntityTypeByEntityIdByEntityVersionParams.shape,
  typeof getVersionHistoryByEntityTypeByEntityIdByEntityVersionResponse
>;

export default withStandardDecorators(getVersionHistoryEntryTool);
