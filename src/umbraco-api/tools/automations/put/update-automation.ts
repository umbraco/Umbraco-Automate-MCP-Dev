/**
 * Update Automation Tool
 *
 * Changes an automation's metadata (alias, name, description, group)
 * without touching its trigger, steps, connections or notification
 * settings. To edit the graph itself, use add-automation-step,
 * update-automation-step, remove-automation-step, connect-automation-steps,
 * disconnect-automation-steps, or set-automation-trigger instead - each of
 * those reads the current definition and saves only its own change, the
 * same way this tool does, so there's no need to round-trip the whole
 * automation body by hand or track its version number yourself.
 */

import { z } from "zod";
import { withStandardDecorators, createToolResult, type ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import { fetchAutomation, toPutBody, saveAutomation } from "../_shared/automation-graph.js";

const inputSchema = {
  automationId: z.string().uuid().describe("Id of the automation to update."),
  alias: z.string().min(1).optional().describe("New unique, code-friendly alias. Omit to leave unchanged."),
  name: z.string().min(1).optional().describe("New display name. Omit to leave unchanged."),
  description: z
    .string()
    .nullish()
    .describe("New description. Pass null to clear it. Omit to leave unchanged."),
  groupId: z
    .string()
    .uuid()
    .nullish()
    .describe(
      "New workspace group (folder) id, from get-automation-group / list-workspace-groups. Pass null to move it to the workspace root. Omit to leave unchanged."
    ),
};

type UpdateAutomationParams = {
  automationId: string;
  alias?: string;
  name?: string;
  description?: string | null;
  groupId?: string | null;
};

const outputSchema = z.object({ message: z.string() });

const updateAutomationTool = {
  name: "update-automation",
  description:
    "Renames an automation, edits its description, or moves it to a different workspace group. Only the fields you provide are changed; the trigger, steps, connections and notification settings are read from the automation's current definition and saved back unmodified. Use the dedicated graph tools (add-automation-step, connect-automation-steps, set-automation-trigger, etc.) to change those instead.",
  inputSchema,
  outputSchema,
  slices: ["update"],
  annotations: {
    idempotentHint: true,
  },
  handler: async (params: UpdateAutomationParams) => {
    const automation = await fetchAutomation(params.automationId);

    const body = toPutBody(automation, {
      alias: params.alias ?? automation.alias,
      name: params.name ?? automation.name,
      description: params.description !== undefined ? params.description : automation.description,
      groupId: params.groupId !== undefined ? params.groupId : automation.groupId,
    });
    await saveAutomation(params.automationId, body);

    return createToolResult({ message: `Automation "${body.name}" updated.` });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(updateAutomationTool);
