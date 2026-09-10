/**
 * Disconnect Automation Steps Tool
 *
 * Removes the connection(s) between two steps, without deleting either
 * step. Use remove-automation-step instead if the step itself should be
 * removed entirely.
 */

import { z } from "zod";
import { withStandardDecorators, createToolResult, type ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import { fetchAutomation, toPutBody, saveAutomation, resolveStep, resolveConnectionSource, applyAutoLayout } from "../_shared/automation-graph.js";

const inputSchema = {
  automationId: z.string().uuid().describe("Id of the automation to disconnect steps within."),
  sourceStep: z
    .string()
    .min(1)
    .describe(
      "The connection's source step, by alias (preferred) or step id. Pass \"trigger\" to remove a connection that runs directly off the automation's trigger."
    ),
  targetStep: z
    .string()
    .min(1)
    .describe("The connection's target step, by alias (preferred) or step id."),
  outcome: z
    .string()
    .optional()
    .describe(
      "If there are multiple connections between the same two steps for different outcomes (e.g. a branching step's 'true' and 'false' paths both pointing at the same target), narrow to the one for this outcome. Omit to remove all connections between the two steps."
    ),
};

const outputSchema = z.object({
  message: z.string(),
  removedCount: z.number().int(),
});

const disconnectAutomationStepsTool = {
  name: "disconnect-automation-steps",
  description:
    "Removes the connection(s) between two steps, identified by alias or step id, without deleting either step. If the two steps have more than one connection between them (distinguished by outcome), pass `outcome` to remove only that one - otherwise all connections between them are removed. Use get-automation first if you need to see the exact current connections.",
  inputSchema,
  outputSchema,
  slices: ["delete"],
  annotations: {
    destructiveHint: true,
  },
  handler: async (params: { automationId: string; sourceStep: string; targetStep: string; outcome?: string }) => {
    const automation = await fetchAutomation(params.automationId);
    const source = resolveConnectionSource(automation, params.sourceStep);
    const target = resolveStep(automation, params.targetStep);

    const remaining = automation.connections.filter((c) => {
      const matches =
        c.sourceStepId === source.id &&
        c.targetStepId === target.id &&
        (params.outcome === undefined || c.outcome === params.outcome);
      return !matches;
    });
    const removedCount = automation.connections.length - remaining.length;

    if (removedCount === 0) {
      throw new Error(
        `No connection found from "${params.sourceStep}" to "${params.targetStep}"${
          params.outcome ? ` for outcome "${params.outcome}"` : ""
        }. Call get-automation to see the current connections.`
      );
    }

    const { steps, canvasState } = applyAutoLayout(automation, remaining);
    const body = toPutBody(automation, { connections: remaining, steps, canvasState });
    await saveAutomation(params.automationId, body);

    return createToolResult({
      message: `Disconnected "${params.sourceStep}" -> "${params.targetStep}".`,
      removedCount,
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(disconnectAutomationStepsTool);
