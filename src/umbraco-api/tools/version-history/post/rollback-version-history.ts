/**
 * Rollback Version History Tool
 *
 * Rolls an entity back to a previously recorded version, replacing its
 * current state with that version's snapshot. This has a real, immediate
 * side effect and creates a new current version — it is not a preview.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollbackParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollbackParams.shape,
  entityType: postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollbackParams.shape.entityType.describe(
    "Entity type in PascalCase, e.g. 'Automation'. See list-version-history-supported-types for the accepted values.",
  ),
  entityId: postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollbackParams.shape.entityId.describe(
    "Id of the entity whose history to read, e.g. an automation id.",
  ),
  entityVersion: postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollbackParams.shape.entityVersion.describe(
    "Version number to restore, from list-version-history.",
  ),
};

const rollbackVersionHistoryTool = {
  name: "rollback-version-history",
  description:
    "Rolls an entity back to a specific past version, identified by entityType, entityId, and entityVersion. This overwrites the entity's current state with that version's snapshot and has a real, immediate side effect — it is not reversible except by rolling back again to another version. Use list-version-history to find valid version numbers and compare-version-history to review what will change before calling this. Use list-version-history-supported-types to confirm a valid entityType (PascalCase, e.g. 'Automation').",
  inputSchema,
  slices: ["action"],
  annotations: {
    destructiveHint: true,
  },
  handler: async ({ entityType, entityId, entityVersion }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postVersionHistoryByEntityTypeByEntityIdByEntityVersionRollback(
        entityType,
        entityId,
        entityVersion,
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<
  typeof inputSchema,
  undefined
>;

export default withStandardDecorators(rollbackVersionHistoryTool);
