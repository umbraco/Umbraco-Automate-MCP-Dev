/**
 * Compare Version History Tool
 *
 * Diffs two versions of the same entity, returning the individual field
 * changes (path, oldValue, newValue) between them.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionParams,
  getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const compareVersionHistoryTool = {
  name: "compare-version-history",
  description:
    "Compares two versions of an entity (fromEntityVersion vs toEntityVersion) and returns the list of field-level changes between them, each with the field path, oldValue, and newValue. Use list-version-history first to find valid version numbers for the entity. Use get-version-history-supported-types to confirm a valid entityType (PascalCase, e.g. 'Automation' - see list-version-history-supported-types for the full list). Review the diff here before deciding whether to call rollback-version-history.",
  inputSchema:
    getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionParams
      .shape,
  outputSchema:
    getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({
    entityType,
    entityId,
    fromEntityVersion,
    toEntityVersion,
  }) => {
    return executeGetApiCall<
      ReturnType<
        ApiClient["getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersion"]
      >,
      ApiClient
    >((client) =>
      client.getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersion(
        entityType,
        entityId,
        fromEntityVersion,
        toEntityVersion,
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<
  typeof getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionParams.shape,
  typeof getVersionHistoryByEntityTypeByEntityIdByFromEntityVersionCompareByToEntityVersionResponse
>;

export default withStandardDecorators(compareVersionHistoryTool);
