/**
 * Step Outputs
 *
 * Branching steps expose named outputs, and a connection has to name one exactly the
 * way the backoffice canvas does or it is silently never followed:
 *
 * - If: "true" / "false" - outcome matching is case-sensitive, so "True" never routes.
 * - Switch: each case's Name, plus "default".
 * - Request Approval: "approved" / "rejected".
 * - Containers (While, ForEach, Parallel): "body" (runs inside) / "done" (runs once
 *   after). The runtime routes these by sourceHandle, not outcome - a connection with
 *   only an outcome is treated as part of the body.
 *
 * The canvas saves every such connection with sourceHandle and outcome both set to the
 * output name (it also draws edges from sourceHandle), so this does the same. Mirrors
 * getNodeType and the handle constants in the Automate client's model-to-flow.ts.
 */

import {
  ToolValidationError,
  UmbracoManagementClient,
  CAPTURE_RAW_HTTP_RESPONSE,
  type HttpResponse,
} from "@umbraco-cms/mcp-server-sdk";
import type { StepConfigurationModel } from "../../../api/generated/umbracoAutomateManagementApi.js";

const IF_ALIAS = "umbracoAutomate.if";
const SWITCH_ALIAS = "umbracoAutomate.switch";
const APPROVAL_ALIAS = "umbracoAutomate.requestApproval";
const PARALLEL_ALIAS = "umbracoAutomate.parallel";
const CONTAINER_ALIASES = new Set(["umbracoAutomate.while", "umbracoAutomate.forEach", PARALLEL_ALIAS]);

export const BODY_HANDLE = "body";
export const DONE_HANDLE = "done";

// Words a model tends to reach for when it means a container's body or its exit.
const CONTAINER_SYNONYMS: Record<string, string> = {
  body: BODY_HANDLE,
  loop: BODY_HANDLE,
  each: BODY_HANDLE,
  iteration: BODY_HANDLE,
  branch: BODY_HANDLE,
  done: DONE_HANDLE,
  after: DONE_HANDLE,
  exit: DONE_HANDLE,
  complete: DONE_HANDLE,
  completed: DONE_HANDLE,
  next: DONE_HANDLE,
};

function switchCaseNames(step: StepConfigurationModel): string[] {
  const cases = (step.settings as Record<string, unknown> | undefined)?.cases;
  if (!Array.isArray(cases)) return [];
  return cases
    .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>).Name ?? (c as Record<string, unknown>).name : undefined))
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

/** The named outputs of a step, or undefined for a step with a single unnamed output. */
export function getStepOutputs(step: StepConfigurationModel): string[] | undefined {
  if (step.actionAlias === IF_ALIAS) return ["true", "false"];
  if (step.actionAlias === SWITCH_ALIAS) return [...switchCaseNames(step), "default"];
  if (step.actionAlias === APPROVAL_ALIAS) return ["approved", "rejected"];
  if (CONTAINER_ALIASES.has(step.actionAlias)) return [BODY_HANDLE, DONE_HANDLE];
  return undefined;
}

/**
 * A container's "done" output runs a single continuation: the runtime uses the first
 * connection on it and never runs the targets of any others.
 */
export function isSingleConnectionOutput(step: StepConfigurationModel, output: string): boolean {
  return CONTAINER_ALIASES.has(step.actionAlias) && output === DONE_HANDLE;
}

/**
 * Resolves the caller's `outcome` for a connection leaving `step` to the exact output name,
 * returning the sourceHandle/outcome pair to save. `step` is undefined for the trigger.
 * Steps without named outputs keep the previous behaviour: outcome passed through as given.
 */
export function resolveConnectionOutput(
  step: StepConfigurationModel | undefined,
  outcome: string | undefined,
): { sourceHandle: string | null; outcome: string | null } {
  const outputs = step ? getStepOutputs(step) : undefined;
  if (!step || !outputs) {
    return { sourceHandle: null, outcome: outcome ?? null };
  }

  const label = step.alias ?? step.id;
  const valid = outputs.map((o) => `"${o}"`).join(", ");
  if (!outcome) {
    throw new ToolValidationError({
      title: "Outcome required",
      detail: `Step "${label}" (${step.actionAlias}) has named outputs, so connections from it must pass outcome - one of ${valid}.`,
    });
  }

  const wanted = outcome.trim();
  const match =
    outputs.find((o) => o === wanted) ??
    outputs.find((o) => o.toLowerCase() === wanted.toLowerCase()) ??
    (CONTAINER_ALIASES.has(step.actionAlias) ? CONTAINER_SYNONYMS[wanted.toLowerCase()] : undefined);
  if (!match) {
    throw new ToolValidationError({
      title: "Unknown outcome",
      detail: `Step "${label}" (${step.actionAlias}) has no output "${outcome}". Valid outcomes: ${valid}.${
        step.actionAlias === SWITCH_ALIAS ? " Switch outputs are its case names - add the case with update-automation-step first." : ""
      }`,
    });
  }
  return { sourceHandle: match, outcome: match };
}

/**
 * Whether the connected Automate has a "done" output on containers. It arrived in 18.3.0;
 * before that every connection from a container is part of its body, so a "done"
 * connection would silently run inside the loop instead of after it. The version comes
 * from the backoffice package manifest; if it can't be read, assume support rather than
 * block the call.
 */
export async function supportsContainerDone(): Promise<boolean> {
  try {
    const response = (await UmbracoManagementClient<{ id?: string; version?: string }[]>(
      { method: "GET", url: "/umbraco/management/api/v1/manifest/manifest" },
      CAPTURE_RAW_HTTP_RESPONSE,
    )) as unknown as HttpResponse<{ id?: string; version?: string }[]>;
    const version = response.data?.find?.((p) => p.id === "Umbraco.Automate")?.version;
    const [major, minor] = (version ?? "").split(/[.+-]/).map(Number);
    if (!Number.isFinite(major) || !Number.isFinite(minor)) return true;
    return major > 18 || (major === 18 && minor >= 3);
  } catch {
    return true;
  }
}

/** Guidance for the `outcome` inputs of the connection tools. */
export const OUTCOME_HELP =
  "Which named output of the source step this connection leaves from. Required when the source step has named outputs, and must match one exactly (matching is case-insensitive here and saved in the exact form): If - \"true\"/\"false\"; Switch - one of its case names, or \"default\"; Request Approval - \"approved\"/\"rejected\"; While/ForEach/Parallel - \"body\" (runs inside the loop/branch; \"loop\" also accepted) or \"done\" (runs once afterwards; \"after\" also accepted; needs Umbraco Automate 18.3+, before which a container has only a body). Omit for steps with a single output, and for the trigger.";
