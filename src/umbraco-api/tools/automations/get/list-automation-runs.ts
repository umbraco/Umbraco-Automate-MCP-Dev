/**
 * List Automation Runs Tool
 *
 * Lists past and in-progress runs (executions) of a single automation, each
 * with its step-level run history. Use trigger-automation to start a new run.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getAutomationsByIdRunsParams,
  getAutomationsByIdRunsQueryParams,
  getAutomationsByIdRunsResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";
import type { GetAutomationsByIdRunsParams } from "../../../api/generated/umbracoAutomateManagementApi.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = {
  ...getAutomationsByIdRunsParams.shape,
  ...getAutomationsByIdRunsQueryParams.shape,
  id: getAutomationsByIdRunsParams.shape.id.describe(
    "Id of the automation whose runs to list.",
  ),
};

const listAutomationRunsTool = {
  name: "list-automation-runs",
  description:
    "Lists runs (executions) of an automation, newest first, with cursor paging (pass nextCursor from the previous response). Each run includes its status, timing, correlation id, error (if any), and a full step-by-step run history. Use this to investigate whether/how an automation has been executing, or to check the outcome of a run started via trigger-automation.",
  inputSchema,
  outputSchema: getAutomationsByIdRunsResponse,
  slices: ["list"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id, skip, take }) => {
    const params: GetAutomationsByIdRunsParams = { skip, take };
    return executeGetApiCall<
      ReturnType<ApiClient["getAutomationsByIdRuns"]>,
      ApiClient
    >((client) =>
      client.getAutomationsByIdRuns(id, params, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof inputSchema, typeof getAutomationsByIdRunsResponse>;

export default withStandardDecorators(listAutomationRunsTool);
