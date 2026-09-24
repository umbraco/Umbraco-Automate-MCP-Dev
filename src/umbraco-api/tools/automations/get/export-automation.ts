/**
 * Export Automation Tool
 *
 * Exports an automation as a portable definition (trigger, steps, connections,
 * canvas state, notification settings and referenced connection types) that
 * can be re-imported into this or another workspace via import-automation,
 * import-automation-into-existing, or validate-automation-import.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsByIdExportParams,
  getAutomationsByIdExportQueryParams,
  getAutomationsByIdExportResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";
import type { GetAutomationsByIdExportParams } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getAutomationsByIdExportParams.shape,
  ...getAutomationsByIdExportQueryParams.shape,
  id: getAutomationsByIdExportParams.shape.id.describe(
    "Id of the automation to export.",
  ),
  include: getAutomationsByIdExportQueryParams.shape.include.describe(
    "Optional. Limits which parts of the automation are exported. Omit to export everything.",
  ),
};

const exportAutomationTool = {
  name: "export-automation",
  description:
    "Exports an automation as a portable definition (trigger, steps, connections, canvas state, notification settings, referenced connection types) suitable for backup or moving to another workspace. Optionally scope what's included via 'include'. Re-import the result with import-automation (new automation) or import-automation-into-existing (overwrite an existing one), or dry-run it first with validate-automation-import.",
  inputSchema,
  outputSchema: getAutomationsByIdExportResponse,
  slices: ["export"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id, include }) => {
    const params: GetAutomationsByIdExportParams = { include };
    return executeGetApiCall<
      ReturnType<ApiClient["getAutomationsByIdExport"]>,
      ApiClient
    >((client) =>
      client.getAutomationsByIdExport(id, params, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof getAutomationsByIdExportResponse>;

export default withStandardDecorators(exportAutomationTool);
