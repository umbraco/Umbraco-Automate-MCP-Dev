/**
 * Remove Automation Step Tool
 *
 * Removes a single step from an automation's graph. Any connections to or
 * from the removed step are removed along with it, so the graph never ends
 * up referencing a step that no longer exists.
 */

import { z } from "zod";
import { withStandardDecorators, createToolResult, type ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import {
  fetchAutomation,
  toPutBody,
  saveAutomation,
  resolveStep,
  applyAutoLayout,
} from "../_shared/automation-graph.js";

const inputSchema = {
  automationId: z.string().uuid().describe("Id of the automation the step belongs to."),
  step: z
    .string()
    .min(1)
    .describe("The step to remove, by its alias (preferred) or its step id, as seen in get-automation."),
};

const outputSchema = z.object({
  message: z.string(),
  removedConnectionCount: z.number().int(),
});

const removeAutomationStepTool = {
  name: "remove-automation-step",
  description:
    "Removes a step from an automation's graph, along with any connections that reference it (incoming or outgoing) so the graph stays consistent. This cannot be undone except by re-adding the step and its connections. Not valid to leave the trigger's first step disconnected - check the resulting graph with get-automation if this step was a hub other steps only reached through it.",
  inputSchema,
  outputSchema,
  slices: ["delete"],
  annotations: {
    destructiveHint: true,
  },
  handler: async (params: { automationId: string; step: string }) => {
    const automation = await fetchAutomation(params.automationId);
    const target = resolveStep(automation, params.step);

    const remainingConnections = automation.connections.filter(
      (c) => c.sourceStepId !== target.id && c.targetStepId !== target.id
    );
    const removedConnectionCount = automation.connections.length - remainingConnections.length;

    const { steps, canvasState } = await applyAutoLayout(
      automation,
      remainingConnections,
      automation.steps.filter((s) => s.id !== target.id)
    );

    const body = toPutBody(automation, {
      steps,
      connections: remainingConnections,
      canvasState,
    });
    await saveAutomation(params.automationId, body);

    return createToolResult({
      message: `Step "${params.step}" removed.`,
      removedConnectionCount,
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(removeAutomationStepTool);
