/**
 * Validate Automation Import Tool
 *
 * Dry-runs an automation import payload (see export-automation) without
 * actually creating or changing anything - returns whether it would succeed
 * plus any errors/warnings (e.g. missing connections referenced by the
 * export). Use import-automation with the same payload once this reports
 * success.
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
  postAutomationsImportValidateBody,
  postAutomationsImportValidateResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";
import type { ImportAutomationRequestModel } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: postAutomationsImportValidateBody.shape.workspaceId.describe(
    "Id of the workspace to validate the import against (from list-workspaces).",
  ),
  exportModel: z.object(postAutomationsImportValidateBody.shape.exportModel.shape).describe(
    "The exact object returned by export-automation, passed through unmodified. Not meant to be written by hand.",
  ),
};

const validateAutomationImportTool = {
  name: "validate-automation-import",
  description:
    "Validates an automation import payload (see export-automation for the exportModel shape) against a workspace without creating or changing anything. `exportModel` should be the exact object returned by export-automation, passed through unmodified rather than hand-authored. Returns success plus any errors/warnings (e.g. connections referenced by the export that don't exist in this workspace). Call import-automation with the same payload once this reports success.",
  inputSchema,
  outputSchema: postAutomationsImportValidateResponse,
  slices: ["import"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async (model: { workspaceId: string; exportModel: ImportAutomationRequestModel["exportModel"] }) => {
    const body: ImportAutomationRequestModel = {
      workspaceId: model.workspaceId,
      exportModel: model.exportModel,
    };
    return executeGetApiCall<
      ReturnType<ApiClient["postAutomationsImportValidate"]>,
      ApiClient
    >((client) =>
      client.postAutomationsImportValidate(body, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof postAutomationsImportValidateResponse>;

export default withStandardDecorators(validateAutomationImportTool);
