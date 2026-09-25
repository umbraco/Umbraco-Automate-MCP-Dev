/**
 * List Version History Tool
 *
 * Lists the recorded versions for a single entity (e.g. an automation),
 * along with the entity's current version number, total version count,
 * and (if applicable) which version is currently published.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getVersionHistoryByEntityTypeByEntityIdParams,
  getVersionHistoryByEntityTypeByEntityIdQueryParams,
  getVersionHistoryByEntityTypeByEntityIdResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = getVersionHistoryByEntityTypeByEntityIdParams.extend({
  ...getVersionHistoryByEntityTypeByEntityIdQueryParams.shape,
  entityType: getVersionHistoryByEntityTypeByEntityIdParams.shape.entityType.describe(
    "Entity type in PascalCase, e.g. 'Automation'. See list-version-history-supported-types for the accepted values.",
  ),
  entityId: getVersionHistoryByEntityTypeByEntityIdParams.shape.entityId.describe(
    "Id of the entity whose history to list, e.g. an automation id.",
  ),
});

const listVersionHistoryTool = {
  name: "list-version-history",
  description:
    "Lists the version history for a single entity, given its entityType and entityId. Returns currentVersion, totalVersions, publishedVersion (if any version is currently published), and a page of version entries (id, version number, dateCreated, createdByUserId, changeDescription, isPublished) ordered newest first. Use list-version-history-supported-types to confirm a valid entityType (PascalCase, e.g. 'Automation'). For entities with many versions, page through the history by passing nextCursor from the previous response. Use the version numbers returned here with get-version-history-entry, compare-version-history, or rollback-version-history.",
  inputSchema: inputSchema.shape,
  outputSchema: getVersionHistoryByEntityTypeByEntityIdResponse,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ entityType, entityId, skip, take }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["getVersionHistoryByEntityTypeByEntityId"]>,
      ApiClient
    >((client) =>
      client.getVersionHistoryByEntityTypeByEntityId(
        entityType,
        entityId,
        { skip, take },
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema.shape,
  typeof getVersionHistoryByEntityTypeByEntityIdResponse
>;

export default withStandardDecorators(listVersionHistoryTool);
