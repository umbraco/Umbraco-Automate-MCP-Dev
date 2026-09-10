/**
 * Resolve Step Type Output Schema Tool
 *
 * Computes the JSON output schema a step type would produce for a given
 * configuration. Some step types have a dynamic output schema that depends
 * on their settings (e.g. a database query action's output shape depends on
 * the configured query), so this must be resolved rather than read statically
 * from the catalogue entry.
 */

import {
  withStandardDecorators,
  executeGetApiCall,
  CAPTURE_RAW_HTTP_RESPONSE,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";
import type { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { postCatalogueStepTypesByAliasOutputSchemaResponse } from "../../../api/generated/umbracoAutomateManagementApi.zod.js";

type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

const inputSchema = z.object({
  alias: z
    .string()
    .describe(
      "The step type alias to resolve, as returned by list-catalogue-actions, list-catalogue-control-flows, list-catalogue-triggers, or list-catalogue-step-types."
    ),
  settings: z
    .record(z.string(), z.unknown())
    .describe(
      "The step's configured settings, matching the shape described by that step type's settingsSchema. Used to resolve a dynamic output schema when hasDynamicOutputSchema is true."
    ),
});

const outputSchema = postCatalogueStepTypesByAliasOutputSchemaResponse;

const resolveStepTypeOutputSchemaTool = {
  name: "resolve-step-type-output-schema",
  description:
    "Computes the JSON schema of the data a configured step would output at runtime, for a given step type alias and settings. Use this when a catalogue entry has hasDynamicOutputSchema set to true, meaning its static outputSchema is not enough — the real output shape depends on how the step is configured (e.g. the columns returned by a database query action depend on the query itself). The resolved schema tells you what fields will be available for later steps in the automation to reference. Read-only: no data is created or changed.",
  inputSchema: inputSchema.shape,
  outputSchema,
  slices: ["read"],
  annotations: {
    readOnlyHint: true,
  },
  handler: async ({ alias, settings }) => {
    return executeGetApiCall<
      ReturnType<ApiClient["postCatalogueStepTypesByAliasOutputSchema"]>,
      ApiClient
    >((client) =>
      client.postCatalogueStepTypesByAliasOutputSchema(
        alias,
        { settings },
        CAPTURE_RAW_HTTP_RESPONSE
      )
    );
  },
} satisfies ToolDefinition<typeof inputSchema.shape, typeof outputSchema>;

export default withStandardDecorators(resolveStepTypeOutputSchemaTool);
