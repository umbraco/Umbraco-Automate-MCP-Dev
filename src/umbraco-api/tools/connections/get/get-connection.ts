/**
 * Get Connection Tool
 *
 * Retrieves the full detail of a single connection, including its settings.
 */

import {
  withStandardDecorators,
  getApiClient,
  createToolResult,
  createToolResultError,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
  type HttpResponse,
  type ProblemDetails,
} from "@umbraco-cms/mcp-server-sdk";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import {
  getConnectionsByIdParams,
  getConnectionsByIdResponse,
} from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

// Key-name patterns that commonly hold credentials in a connection's settings
// bag. The API returns `settings` as an untyped record (its shape depends on
// the connection's type), so there is no schema-level way to know which
// fields are secret — matching on common naming conventions is the only
// generic redaction available without per-type knowledge.
const SECRET_KEY_PATTERN =
  /secret|password|token|api[-_]?key|access[-_]?key|client[-_]?secret|private[-_]?key|credential|auth/i;
const REDACTED_PLACEHOLDER = "***REDACTED***";

function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SECRET_KEY_PATTERN.test(key) && typeof val === "string"
          ? REDACTED_PLACEHOLDER
          : redactSecrets(val),
      ])
    );
  }
  return value;
}

const getConnectionTool = {
  name: "get-connection",
  description:
    "Gets a single connection by id, including its alias, name, type, version and settings. The settings object is whatever the connection's type requires (e.g. base URL, API key, account id) — check the catalogue's connection-types listing for the settingsSchema of a given type. Fields whose name looks like a credential (secret, password, token, api key, etc.) are redacted server-side and returned as \"***REDACTED***\" — this tool cannot be used to read back a connection's raw secret values. Use test-connection to validate credentials without needing to inspect them.",
  inputSchema: getConnectionsByIdParams.shape,
  outputSchema: getConnectionsByIdResponse,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ id }) => {
    const client = getApiClient<ApiClient>();
    const response = (await client.getConnectionsById(
      id,
      CAPTURE_RAW_HTTP_RESPONSE
    )) as unknown as HttpResponse<ProblemDetails | Record<string, unknown>>;

    if (response.status >= 200 && response.status < 300) {
      const data = response.data as Record<string, unknown>;
      return createToolResult({
        ...data,
        settings: redactSecrets(data.settings),
      });
    }

    const errorData: ProblemDetails = (response.data as ProblemDetails) || {
      status: response.status,
      detail: response.statusText,
    };
    return createToolResultError(errorData);
  },
} satisfies ToolDefinition<
  typeof getConnectionsByIdParams.shape,
  typeof getConnectionsByIdResponse
>;

export default withStandardDecorators(getConnectionTool);
