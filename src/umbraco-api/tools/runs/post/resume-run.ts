/**
 * Resume Run Tool
 *
 * Resumes a workflow run that is currently Suspended, continuing execution
 * from where it was paused. Not valid for runs in any other status.
 */

import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postRunsByIdResumeParams } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const resumeRunTool = {
  name: "resume-run",
  description:
    "Resumes a workflow run that is currently Suspended, continuing execution from where it was paused. Only valid when the run's status is Suspended — check status via get-run-by-id first. Not the same as replay-run, which starts a finished run over from the beginning.",
  inputSchema: postRunsByIdResumeParams.shape,
  slices: ["action"],
  annotations: {},
  handler: async ({ id }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.postRunsByIdResume(id, CAPTURE_RAW_HTTP_RESPONSE),
    );
  },
} satisfies ToolDefinition<typeof postRunsByIdResumeParams.shape, undefined>;

export default withStandardDecorators(resumeRunTool);
