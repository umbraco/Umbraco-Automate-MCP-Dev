/**
 * Import Automation Into Existing Tool
 *
 * Overwrites an existing automation's trigger/steps/connections/canvas
 * state with a previously exported definition (see export-automation).
 * Unlike import-automation, this replaces content in place rather than
 * creating a new automation - use it to restore a backup or apply an
 * exported definition from another workspace onto this automation. Dry-run
 * the same exportModel with validate-automation-import first if unsure.
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
  putAutomationsByIdImportParams,
  putAutomationsByIdImportBody,
  putAutomationsByIdImportResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";
import type { AutomationExportModel } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  id: putAutomationsByIdImportParams.shape.id.describe(
    "Id of the existing automation to overwrite.",
  ),
  exportModel: z.object(putAutomationsByIdImportBody.shape).describe(
    "The exact object returned by export-automation, passed through unmodified. Not meant to be written by hand.",
  ),
};

const importAutomationIntoExistingTool = {
  name: "import-automation-into-existing",
  description:
    "Overwrites the trigger, steps, connections, canvas state and notification settings of an existing automation (identified by id) with a previously exported definition (see export-automation for the exportModel shape). `exportModel` should be the exact object returned by export-automation, passed through unmodified - it is not meant to be hand-authored; to make a targeted change to an existing automation's graph, use update-automation-step/add-automation-step/connect-automation-steps/set-automation-trigger instead. This replaces content in place rather than creating a new automation - use import-automation instead if you want a brand new automation. Consider validate-automation-import first to check the export is compatible with this workspace.",
  inputSchema,
  outputSchema: putAutomationsByIdImportResponse,
  slices: ["import"],
  annotations: {
    idempotentHint: true,
  },
  handler: async (model: { id: string; exportModel: AutomationExportModel }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["putAutomationsByIdImport"]>,
      ApiClient
    >((client) =>
      client.putAutomationsByIdImport(
        model.id,
        model.exportModel,
        CAPTURE_RAW_HTTP_RESPONSE,
      ),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof putAutomationsByIdImportResponse>;

export default withStandardDecorators(importAutomationIntoExistingTool);
