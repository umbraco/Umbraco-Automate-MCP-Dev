import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import decideApprovalStepTool from "../post/decide-approval-step.js";
import listPendingApprovalsTool from "../get/list-pending-approvals.js";
// This collection has no create/delete tools of its own - a pending approval only exists
// as a side effect of a real automation run pausing on an approval step. Reusing the
// automations/workspaces collections' own already-validated builders and tools to build
// that real scenario end-to-end, rather than fabricating data.
import { AutomationBuilder } from "../../automations/__tests__/helpers/automation-builder.js";
import { WorkspaceBuilder } from "../../workspaces/__tests__/helpers/workspace-builder.js";
import addAutomationStepTool from "../../automations/post/add-automation-step.js";
import setAutomationTriggerTool from "../../automations/put/set-automation-trigger.js";
import publishAutomationTool from "../../automations/post/publish-automation.js";
import unpublishAutomationTool from "../../automations/post/unpublish-automation.js";
import triggerAutomationTool from "../../automations/post/trigger-automation.js";
import listAutomationRunsTool from "../../automations/get/list-automation-runs.js";
import getRunByIdTool from "../../runs/get/get-run-by-id.js";

const TEST_WORKSPACE_ALIAS = "_testWsApprovals_decide";
const TEST_AUTOMATION_ALIAS = "_test_decide_approval_automation";
// The only trigger with no settingsSchema (confirmed in automations/__tests__/helpers) and
// supportsManualRun, so trigger-automation can start a run without configuring anything.
const TEST_TRIGGER_ALIAS = "umbracoAutomate.manual";
// The catalogue action that pauses a run waiting for a human decision (confirmed against
// the real instance's GET /catalogue/actions - alias "umbracoAutomate.requestApproval",
// no connectionTypeAlias requirement, no required settings fields).
const TEST_APPROVAL_ACTION_ALIAS = "umbracoAutomate.requestApproval";
const TEST_APPROVAL_STEP_ALIAS = "approvalStep";

const POLL_INTERVAL_MS = 500;
const POLL_ATTEMPTS = 40; // ~20s

async function waitFor<T>(
  poll: () => Promise<T | undefined>,
  failureMessage: string,
): Promise<T> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const value = await poll();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(failureMessage);
}

describe("decide-approval-step", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Approvals Decide")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_AUTOMATION_ALIAS)
      .withName("_Test Decide Approval Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    try {
      await unpublishAutomationTool.handler(
        { id: automation.getId() },
        createMockRequestHandlerExtra(),
      );
    } catch {
      // Not published - nothing to unpublish.
    }
    await automation.delete();
  });

  /**
   * Builds an automation with a manual trigger and a single requestApproval step,
   * publishes it, triggers a run, then polls list-automation-runs / get-run-by-id until
   * that run's step reaches WaitingForInput - the state list-pending-approvals surfaces.
   */
  async function triggerRunAndWaitForApprovalStep(): Promise<{
    runId: string;
    stepId: string;
  }> {
    const context = createMockRequestHandlerExtra();

    await setAutomationTriggerTool.handler(
      {
        automationId: automation.getId(),
        triggerAlias: TEST_TRIGGER_ALIAS,
        settings: undefined,
      },
      context,
    );
    await addAutomationStepTool.handler(
      {
        automationId: automation.getId(),
        actionAlias: TEST_APPROVAL_ACTION_ALIAS,
        alias: TEST_APPROVAL_STEP_ALIAS,
        name: "Approval Step",
        settings: { prompt: "Approve this test run?" },
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      context,
    );
    await publishAutomationTool.handler({ id: automation.getId() }, context);
    await triggerAutomationTool.handler({ id: automation.getId() }, context);

    const runId = await waitFor(async () => {
      const runsResult = await listAutomationRunsTool.handler(
        { id: automation.getId() },
        context,
      );
      const structured = runsResult.structuredContent as {
        items: Array<{ id: string }>;
      };
      return structured.items[0]?.id;
    }, "No run was created after triggering the automation.");

    const stepId = await waitFor(async () => {
      const runResult = await getRunByIdTool.handler({ id: runId }, context);
      const structured = runResult.structuredContent as {
        stepRuns: Array<{ stepId: string; status: string }>;
      };
      return structured.stepRuns.find((s) => s.status === "WaitingForInput")?.stepId;
    }, "The run never reached a WaitingForInput step.");

    return { runId, stepId };
  }

  it(
    "should approve a run step that is waiting for a human decision",
    async () => {
      const context = createMockRequestHandlerExtra();
      const { runId, stepId } = await triggerRunAndWaitForApprovalStep();

      // Sanity check: list-pending-approvals should surface this exact run/step first.
      const pending = await listPendingApprovalsTool.handler(undefined as never, context);
      const pendingStructured = pending.structuredContent as {
        items: Array<{ runId: string; stepId: string }>;
      };
      expect(
        pendingStructured.items.some((p) => p.runId === runId && p.stepId === stepId),
      ).toBe(true);

      const result = await decideApprovalStepTool.handler(
        { runId, stepId, outcome: "Approved", comment: "Looks good" },
        context,
      );

      expect(result.isError).toBeFalsy();
      expect(createSnapshotResult(result)).toMatchSnapshot();
    },
    30000,
  );

  it("should return an error when deciding a step that does not exist", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await decideApprovalStepTool.handler(
      {
        runId: "00000000-0000-0000-0000-000000000000",
        stepId: "00000000-0000-0000-0000-000000000000",
        outcome: "Approved",
        comment: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
