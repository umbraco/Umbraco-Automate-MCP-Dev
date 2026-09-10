/**
 * Update Connection Tool
 *
 * Replaces a connection's alias, name, type and settings. Uses optimistic
 * concurrency (version) to detect conflicting edits.
 */

import { z } from "zod";
import {
  withStandardDecorators,
  executeVoidApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  putConnectionsByIdParams,
  putConnectionsByIdBody,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = z.object({
  ...putConnectionsByIdParams.shape,
  ...putConnectionsByIdBody.shape,
});

const updateConnectionTool = {
  name: "update-connection",
  description:
    "Replaces a connection's alias, name, type and settings by id. This is a full replace, not a partial patch — provide all fields, including any settings you want to keep. Requires the connection's current `version` (from get-connection or list-connections) to detect conflicting edits from someone else; a mismatched version returns a conflict error, so re-fetch and retry. A connection's `type` must match one of the aliases returned by the catalogue's connection-types listing, and its settings must satisfy that type's settingsSchema.",
  inputSchema: inputSchema.shape,
  slices: ["update"],
  annotations: {
    idempotentHint: true,
  },
  handler: async ({ id, alias, name, type, settings, version }) => {
    return executeVoidApiCall<ApiClient>((client) =>
      client.putConnectionsById(
        id,
        { alias, name, type, settings, version },
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema.shape>;

export default withStandardDecorators(updateConnectionTool);
