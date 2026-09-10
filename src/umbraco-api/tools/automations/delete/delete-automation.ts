/**
 * Delete Automation Tool
 *
 * Permanently deletes an automation, its definition and its run history.
 * This cannot be undone - if you might need it again, use export-automation
 * to save a copy first, and unpublish-automation instead if you only want to
 * stop it from running.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { deleteAutomationsByIdParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const deleteAutomationTool = {
  name: "delete-automation",
  description:
    "Permanently deletes an automation by id, including its run history. This cannot be undone. Use export-automation first if you might want to restore it later, or unpublish-automation instead if you only want to stop it from running.",
  inputSchema: deleteAutomationsByIdParams.shape,
  annotations: {
    destructiveHint: true,
  },
  slices: ["delete"],
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.deleteAutomationsById(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof deleteAutomationsByIdParams.shape>;

export default withStandardDecorators(deleteAutomationTool);
