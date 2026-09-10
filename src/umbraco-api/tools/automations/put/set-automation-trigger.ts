/**
 * Set Automation Trigger Tool
 *
 * Sets or replaces the automation's trigger - what starts a run - without
 * touching its steps, connections, or anything else. Pass no triggerAlias
 * to clear the trigger entirely (the automation cannot be published without
 * one).
 */

import { z } from "zod";
import { withStandardDecorators, createToolResult, type ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import { fetchAutomation, toPutBody, saveAutomation } from "../_shared/automation-graph.js";

const inputSchema = {
  automationId: z.string().uuid().describe("Id of the automation to set the trigger for."),
  triggerAlias: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Alias of the trigger type to use, as returned by list-catalogue-triggers. Omit (leave unset) to clear the automation's trigger entirely."
    ),
  settings: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "The trigger's configuration, matching the shape described by that trigger type's settingsSchema (see list-catalogue-triggers). Required when setting a triggerAlias; ignored when clearing the trigger."
    ),
};

type SetAutomationTriggerParams = {
  automationId: string;
  triggerAlias?: string;
  settings?: Record<string, unknown>;
};

const outputSchema = z.object({ message: z.string() });

const setAutomationTriggerTool = {
  name: "set-automation-trigger",
  description:
    "Sets what starts the automation: a trigger type (from list-catalogue-triggers) and its settings. Replaces any existing trigger entirely. Omit triggerAlias to remove the trigger - a Draft automation with no trigger can still be edited, but publish-automation will fail until one is set. Steps and connections are left unchanged.",
  inputSchema,
  outputSchema,
  slices: ["update"],
  annotations: {
    idempotentHint: true,
  },
  handler: async (params: SetAutomationTriggerParams) => {
    const automation = await fetchAutomation(params.automationId);

    const body = toPutBody(automation, {
      trigger: params.triggerAlias
        ? { triggerAlias: params.triggerAlias, settings: params.settings ?? {} }
        : null,
    });
    await saveAutomation(params.automationId, body);

    return createToolResult({
      message: params.triggerAlias
        ? `Trigger set to "${params.triggerAlias}".`
        : "Trigger cleared.",
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(setAutomationTriggerTool);
