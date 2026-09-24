/**
 * Connect Automation Steps Tool
 *
 * Wires one step's output to another step's input. A step with no incoming
 * connection runs directly off the trigger; every other step only runs once
 * something connects into it. Use add-automation-step first to create the
 * steps, then this tool to link them into a flow.
 */

import { z } from "zod";
import { withStandardDecorators, createToolResult, type ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import { fetchAutomation, toPutBody, saveAutomation, resolveStep, resolveConnectionSource, applyAutoLayout } from "../_shared/automation-graph.js";

const operators = [
  "Equals",
  "NotEquals",
  "Contains",
  "NotContains",
  "StartsWith",
  "EndsWith",
  "GreaterThan",
  "LessThan",
  "GreaterThanOrEquals",
  "LessThanOrEquals",
  "IsEmpty",
  "IsNotEmpty",
] as const;

const conditionSchema = z.object({
  leftOperand: z
    .string()
    .describe("Expression to test, e.g. a reference to the source step's output or trigger data."),
  operator: z.enum(operators),
  rightOperand: z
    .string()
    .describe("Value to compare against. Ignored for IsEmpty/IsNotEmpty but still required by the API - pass an empty string."),
});

const inputSchema = {
  automationId: z.string().uuid().describe("Id of the automation to connect steps within."),
  sourceStep: z
    .string()
    .min(1)
    .describe(
      "The step this connection runs from, by alias (preferred) or step id. Pass the literal \"trigger\" to run this step directly off the automation's trigger instead of another step."
    ),
  targetStep: z
    .string()
    .min(1)
    .describe("The step this connection runs to, by alias (preferred) or step id."),
  outcome: z
    .string()
    .optional()
    .describe(
      "For a step with multiple named outputs (e.g. a branching control-flow step's 'true'/'false' paths), which outcome this connection follows. Omit for steps with a single, unconditional output."
    ),
  conditions: z
    .array(conditionSchema)
    .optional()
    .describe(
      "Optional list of conditions that must ALL be true (AND) for this connection to be followed - use this for a conditional path off a branching step. Omit for an unconditional connection. This tool only supports a single AND-group; for the rarer OR-of-AND case, build the connection through the Umbraco backoffice canvas instead."
    ),
};

type ConnectAutomationStepsParams = {
  automationId: string;
  sourceStep: string;
  targetStep: string;
  outcome?: string;
  conditions?: { leftOperand: string; operator: (typeof operators)[number]; rightOperand: string }[];
};

const outputSchema = z.object({ message: z.string() });

const connectAutomationStepsTool = {
  name: "connect-automation-steps",
  description:
    "Connects one step's output to another step's input, so the target step runs after the source step (optionally only for a specific outcome, and/or only when conditions are met). The target step must already exist on the automation - use add-automation-step first. Pass sourceStep: \"trigger\" to run the target step directly off the automation's trigger instead of another step. Adding a connection does not remove any existing connections between other steps. Also re-lays out every step's canvas position top-down by distance from the trigger, so the graph reads as a flow instead of piling up wherever add-automation-step happened to place it.",
  inputSchema,
  outputSchema,
  slices: ["update"],
  annotations: {
    idempotentHint: false,
  },
  handler: async (params: ConnectAutomationStepsParams) => {
    const automation = await fetchAutomation(params.automationId);
    const source = resolveConnectionSource(automation, params.sourceStep);
    const target = resolveStep(automation, params.targetStep);

    const alreadyConnected = automation.connections.some(
      (c) =>
        c.sourceStepId === source.id &&
        c.targetStepId === target.id &&
        (c.outcome ?? null) === (params.outcome ?? null)
    );
    if (alreadyConnected) {
      throw new Error(
        `A connection from "${params.sourceStep}" to "${params.targetStep}"${
          params.outcome ? ` for outcome "${params.outcome}"` : ""
        } already exists - use disconnect-automation-steps first if you need to replace it (e.g. with different conditions).`
      );
    }

    const newConnection = {
      sourceStepId: source.id,
      sourceHandle: null,
      targetStepId: target.id,
      targetHandle: null,
      outcome: params.outcome ?? null,
      filter: params.conditions?.length
        ? { groups: [{ conditions: params.conditions }] }
        : null,
    };

    const newConnections = [...automation.connections, newConnection];
    const { steps, canvasState } = applyAutoLayout(automation, newConnections);

    const body = toPutBody(automation, {
      connections: newConnections,
      steps,
      canvasState,
    });
    await saveAutomation(params.automationId, body);

    return createToolResult({
      message: `Connected "${params.sourceStep}" -> "${params.targetStep}".`,
    });
  },
} satisfies ToolDefinition<typeof inputSchema, typeof outputSchema>;

export default withStandardDecorators(connectAutomationStepsTool);
