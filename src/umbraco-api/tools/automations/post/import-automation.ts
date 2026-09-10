/**
 * Import Automation Tool
 *
 * Creates a new automation in a workspace from a previously exported
 * definition (see export-automation). Note: this reuses the exported
 * automation's original id rather than minting a new one (verified against
 * the live API) - importing the same export twice, or into a workspace that
 * already has an automation with that id, will conflict. To overwrite an
 * existing automation in place, use import-automation-into-existing
 * instead. Dry-run the same payload first with validate-automation-import to
 * catch problems (e.g. missing connections) before committing.
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
  postAutomationsImportBody,
  postAutomationsImportResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";
import type { ImportAutomationRequestModel } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  workspaceId: postAutomationsImportBody.shape.workspaceId,
  exportModel: z.object(postAutomationsImportBody.shape.exportModel.shape),
};

const importAutomationTool = {
  name: "import-automation",
  description:
    "Creates a new automation in the given workspace from an exported definition (see export-automation for the exportModel shape). `exportModel` should be the exact object returned by export-automation, passed through unmodified - it is not meant to be hand-authored; to build an automation's graph yourself, use create-automation followed by add-automation-step/connect-automation-steps/set-automation-trigger instead. This reuses the exported automation's original id rather than generating a new one - importing the same export twice, or into a workspace where that id already exists, will fail. Use validate-automation-import first to check for problems without making changes.",
  inputSchema,
  outputSchema: postAutomationsImportResponse,
  slices: ["import"],
  handler: async (model: { workspaceId: string; exportModel: ImportAutomationRequestModel["exportModel"] }) => {
    const body: ImportAutomationRequestModel = {
      workspaceId: model.workspaceId,
      exportModel: model.exportModel,
    };
    return executeGetApiCall<
      ReturnType<ApiClient["postAutomationsImport"]>,
      ApiClient
    >((client) => client.postAutomationsImport(body, CAPTURE_RAW_HTTP_RESPONSE));
  },
} satisfies ToolDefinition<typeof inputSchema, typeof postAutomationsImportResponse>;

export default withStandardDecorators(importAutomationTool);
