/**
 * Automation Graph Helpers
 *
 * Shared internals for the step/connection/trigger composite tools
 * (add-automation-step, update-automation-step, remove-automation-step,
 * connect-automation-steps, disconnect-automation-steps,
 * set-automation-trigger) and the metadata-only update-automation tool.
 *
 * The Automate Management API only exposes a full-replace PUT for an
 * automation's definition (trigger + steps + connections + canvasState +
 * notificationSettings + version, all-or-nothing with optimistic
 * concurrency). Asking an LLM to author that whole body by hand - inventing
 * step UUIDs, wiring sourceStepId/targetStepId references, matching a
 * regex-constrained retryInterval duration string, and round-tripping a
 * version number - is exactly the anti-pattern the MCP tool review flagged.
 *
 * These helpers hide that round trip: every composite tool does an internal
 * get-automation, mutates just the piece it owns, and PUTs the result back
 * with the version it just read. This does not eliminate the API's
 * optimistic-concurrency check (a genuine concurrent edit still fails), it
 * just stops the LLM from having to manage it by hand for routine graph
 * edits.
 */

import {
  getApiClient,
  UmbracoApiError,
  ToolValidationError,
  CAPTURE_RAW_HTTP_RESPONSE,
  type HttpResponse,
  type ProblemDetails,
} from "@umbraco-cms/mcp-server-sdk";
import type {
  getUmbracoAutomateManagementAPI,
  AutomationResponseModel,
  UpdateAutomationRequestModel,
  StepConfigurationModel,
  StepConnectionModel,
} from "../../../api/generated/umbracoAutomateManagementApi.js";

export type ApiClient = ReturnType<typeof getUmbracoAutomateManagementAPI>;

/** Fetches the current full definition of an automation, throwing an actionable error on failure. */
export async function fetchAutomation(id: string): Promise<AutomationResponseModel> {
  const client = getApiClient<ApiClient>();
  const response = (await client.getAutomationsById(
    id,
    CAPTURE_RAW_HTTP_RESPONSE
  )) as unknown as HttpResponse<AutomationResponseModel | ProblemDetails>;

  if (response.status < 200 || response.status >= 300) {
    throw new UmbracoApiError(
      (response.data as ProblemDetails) ?? {
        status: response.status,
        detail: response.statusText,
      }
    );
  }
  return response.data as AutomationResponseModel;
}

/**
 * Builds the full PUT body from a freshly-fetched automation, applying the
 * given overrides on top. Anything not overridden is copied through as-is,
 * so callers only need to specify the piece of the graph they're changing.
 */
export function toPutBody(
  automation: AutomationResponseModel,
  overrides: Partial<UpdateAutomationRequestModel> = {}
): UpdateAutomationRequestModel {
  return {
    alias: automation.alias,
    name: automation.name,
    description: automation.description ?? null,
    groupId: automation.groupId ?? null,
    trigger: automation.trigger ?? null,
    steps: automation.steps.map(stripStepReadOnlyFields),
    connections: automation.connections,
    canvasState: automation.canvasState ?? null,
    notificationSettings: automation.notificationSettings ?? null,
    version: automation.version,
    ...overrides,
  };
}

// The GET response's step shape includes `connectionId` (which connection
// created this step, for steps that call another automation) - the PUT
// body's step shape doesn't accept it back, so it must be dropped when
// round-tripping steps read from GET into a PUT body.
export function stripStepReadOnlyFields(step: StepConfigurationModel): StepConfigurationModel {
  const { connectionId: _connectionId, ...rest } = step;
  return rest;
}

/**
 * Saves a full PUT body back to the automation. Throws on any non-2xx
 * response. A 409/412 means the automation was changed by someone else
 * since it was read (optimistic concurrency) - every composite tool built
 * on this helper re-fetches fresh state on each call, so simply retrying
 * the same tool call is a safe and sufficient fix, and the resulting error
 * says so explicitly rather than surfacing a raw HTTP status.
 */
export async function saveAutomation(
  id: string,
  body: UpdateAutomationRequestModel
): Promise<void> {
  const client = getApiClient<ApiClient>();
  const response = (await client.putAutomationsById(
    id,
    body,
    CAPTURE_RAW_HTTP_RESPONSE
  )) as unknown as HttpResponse<ProblemDetails | void>;

  if (response.status === 409 || response.status === 412) {
    throw new ToolValidationError({
      title: "Automation changed since it was read",
      status: response.status,
      detail:
        "This automation was modified by someone else between reading it and saving this change (optimistic concurrency conflict). Call this tool again with the same arguments - it will re-read the current definition and retry automatically.",
    });
  }

  if (response.status < 200 || response.status >= 300) {
    throw new UmbracoApiError(
      (response.data as ProblemDetails) ?? {
        status: response.status,
        detail: response.statusText,
      }
    );
  }
}

/**
 * Resolves a caller-supplied step reference (its `alias`, or its raw step
 * id) to the actual step. Steps are matched by alias first since that's the
 * stable, human-chosen name; the id is also accepted since it's what
 * get-automation/list results show for a step that has no alias set.
 */
export function resolveStep(
  automation: AutomationResponseModel,
  ref: string
): StepConfigurationModel {
  const byAlias = automation.steps.find((s) => s.alias === ref);
  if (byAlias) return byAlias;

  const byId = automation.steps.find((s) => s.id === ref);
  if (byId) return byId;

  const known = automation.steps
    .map((s) => s.alias ?? s.id)
    .join(", ") || "(no steps yet)";
  throw new ToolValidationError({
    title: "Step not found",
    detail: `No step with alias or id "${ref}" exists on this automation. Known steps: ${known}. Call get-automation to see the current step list.`,
  });
}

// The API represents "runs directly off the trigger" as a connection whose
// sourceStepId is this all-zero sentinel - it doesn't appear in `steps` (the
// trigger isn't a step), so resolveStep alone can never match it. Every
// automation actually wired up in the backoffice canvas has a connection
// shaped this way for its first step(s).
export const TRIGGER_STEP_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Resolves a connection *source* reference, which - unlike a plain step
 * reference - may also mean "the automation's trigger". Callers pass the
 * literal keyword "trigger" (case-insensitive) or the trigger sentinel id
 * to connect a step directly off the trigger; anything else is resolved as
 * a normal step via resolveStep. Only sources may refer to the trigger - a
 * connection's target is always a real step.
 */
export function resolveConnectionSource(
  automation: AutomationResponseModel,
  ref: string
): { id: string } {
  if (ref === TRIGGER_STEP_ID || ref.trim().toLowerCase() === "trigger") {
    if (!automation.trigger) {
      throw new ToolValidationError({
        title: "No trigger configured",
        detail: `"${ref}" refers to the automation's trigger, but this automation has no trigger set yet. Call set-automation-trigger first.`,
      });
    }
    return { id: TRIGGER_STEP_ID };
  }
  return resolveStep(automation, ref);
}

const LAYOUT_X_SPACING = 320;
const LAYOUT_Y_SPACING = 260;

/**
 * Lays out steps top-down by their distance from the trigger (row = number
 * of hops from the trigger, following connections; siblings at the same
 * row are spread left-to-right, centered), instead of the graph the API
 * hands back with every step piled on top of the last one added. Distance
 * is a longest-path over a topological order (Kahn's algorithm) so a step
 * with multiple incoming connections (a join after a branch) sits below
 * all of its parents, not just the first one processed. A step with a
 * cyclic or otherwise unreachable path from the trigger never gets
 * dequeued and is treated the same as one that's simply not connected yet
 * (add-automation-step's default): it's placed in one extra row below
 * everything else rather than left at its stale position.
 */
export function computeAutoLayout(
  steps: StepConfigurationModel[],
  connections: StepConnectionModel[]
): { stepPositions: Record<string, { x: number; y: number }>; triggerPosition: { x: number; y: number } } {
  const childrenByParent = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const step of steps) indegree.set(step.id, 0);
  for (const c of connections) {
    const list = childrenByParent.get(c.sourceStepId) ?? [];
    list.push(c.targetStepId);
    childrenByParent.set(c.sourceStepId, list);
    if (c.targetStepId !== TRIGGER_STEP_ID) {
      indegree.set(c.targetStepId, (indegree.get(c.targetStepId) ?? 0) + 1);
    }
  }

  const depth = new Map<string, number>([[TRIGGER_STEP_ID, 0]]);
  const remainingIndegree = new Map(indegree);
  const queue: string[] = [TRIGGER_STEP_ID];
  while (queue.length) {
    const current = queue.shift()!;
    const currentDepth = depth.get(current) ?? 0;
    for (const childId of childrenByParent.get(current) ?? []) {
      depth.set(childId, Math.max(depth.get(childId) ?? 0, currentDepth + 1));
      const remaining = (remainingIndegree.get(childId) ?? 0) - 1;
      remainingIndegree.set(childId, remaining);
      if (remaining <= 0) queue.push(childId);
    }
  }

  const byDepth = new Map<number, string[]>();
  const unreached: string[] = [];
  for (const step of steps) {
    const d = depth.get(step.id);
    if (d === undefined) {
      unreached.push(step.id);
      continue;
    }
    const list = byDepth.get(d) ?? [];
    list.push(step.id);
    byDepth.set(d, list);
  }

  const stepPositions: Record<string, { x: number; y: number }> = {};
  const placeRow = (ids: string[], row: number) => {
    ids.forEach((id, i) => {
      stepPositions[id] = { x: (i - (ids.length - 1) / 2) * LAYOUT_X_SPACING, y: row * LAYOUT_Y_SPACING };
    });
  };
  for (const [row, ids] of byDepth.entries()) {
    if (row === 0) continue; // row 0 is the trigger itself, which isn't a step
    placeRow(ids, row);
  }
  if (unreached.length) {
    placeRow(unreached, (Math.max(0, ...byDepth.keys()) || 0) + 1);
  }

  return { stepPositions, triggerPosition: { x: 0, y: 0 } };
}

/**
 * Applies computeAutoLayout to an automation's steps for a given (possibly
 * about-to-be-saved) connections list, returning ready-to-use `steps` and
 * `canvasState` overrides for toPutBody. Any existing canvas viewport is
 * preserved - only positions and the trigger's canvas position change.
 */
export function applyAutoLayout(
  automation: AutomationResponseModel,
  connections: StepConnectionModel[]
): { steps: StepConfigurationModel[]; canvasState: string } {
  const { stepPositions, triggerPosition } = computeAutoLayout(automation.steps, connections);

  const steps = automation.steps.map((s) => ({
    ...stripStepReadOnlyFields(s),
    position: stepPositions[s.id] ?? s.position,
  }));

  let canvas: Record<string, unknown> = {};
  if (automation.canvasState) {
    try {
      canvas = JSON.parse(automation.canvasState) as Record<string, unknown>;
    } catch {
      canvas = {};
    }
  }
  canvas.triggerPosition = triggerPosition;

  return { steps, canvasState: JSON.stringify(canvas) };
}
