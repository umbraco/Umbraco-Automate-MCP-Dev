import { CAPTURE_RAW_HTTP_RESPONSE, type HttpResponse } from "@umbraco-cms/mcp-server-sdk";
import { createMockRequestHandlerExtra } from "@umbraco-cms/mcp-server-sdk/testing";
import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import type { AutomationRunResponseModel } from "../../../../api/generated/umbracoAutomateManagementApi.js";
// Reused, already-validated fixture builders from the workspaces/automations collections -
// the runs collection has no create tool of its own: a run only comes into existence by
// triggering a real, published automation.
import { WorkspaceBuilder } from "../../../workspaces/__tests__/helpers/workspace-builder.js";
import {
  AutomationBuilder,
  TEST_ACTION_ALIAS,
  TEST_STEP_ALIAS,
  TEST_TRIGGER_ALIAS,
} from "../../../automations/__tests__/helpers/automation-builder.js";
import setAutomationTriggerTool from "../../../automations/put/set-automation-trigger.js";
import addAutomationStepTool from "../../../automations/post/add-automation-step.js";
import publishAutomationTool from "../../../automations/post/publish-automation.js";
import triggerAutomationTool from "../../../automations/post/trigger-automation.js";

// A run only exists during/after a trigger, so all runs fixtures are scoped under this prefix
// to keep cleanup from colliding with the automations collection's own "_test..." fixtures.
export const TEST_RUNS_WORKSPACE_ALIAS = "_testWsRuns";
export const TEST_RUNS_AUTOMATION_ALIAS = "_test_runs_fixture_automation";

// Confirmed against the real instance: the umbracoAutomate.delay action keeps the run's own
// top-level status as "Running" for its whole configured duration (it does not flip the run to
// "Suspended" the way a human-approval WaitingForInput step would) - so a delay long enough to
// outlast this fixture's setup calls gives a reliable window to exercise suspend-run/terminate-run
// against a genuinely Running run, and resume-run against the Suspended run that suspend-run
// itself produces.
export const RUN_FIXTURE_DELAY = "00:00:20";

/**
 * Builds a workspace + published, triggerable automation (single delay step, manual trigger)
 * and triggers one real run against it. The run stays in status "Running" for
 * RUN_FIXTURE_DELAY, giving tests a real window to call the runs collection's lifecycle tools
 * against an actual in-flight run instead of only asserting precondition errors.
 */
export class RunFixture {
  private workspace?: WorkspaceBuilder;
  private automation?: AutomationBuilder;
  private runId?: string;

  async setup(): Promise<this> {
    this.workspace = await new WorkspaceBuilder()
      .withAlias(TEST_RUNS_WORKSPACE_ALIAS)
      .withName("_Test Workspace Runs Fixture")
      .create();

    this.automation = await new AutomationBuilder()
      .withAlias(TEST_RUNS_AUTOMATION_ALIAS)
      .withName("_Test Runs Fixture Automation")
      .withWorkspaceId(this.workspace.getId())
      .create();

    await setAutomationTriggerTool.handler(
      {
        automationId: this.automation.getId(),
        triggerAlias: TEST_TRIGGER_ALIAS,
        settings: undefined,
      },
      createMockRequestHandlerExtra(),
    );
    await addAutomationStepTool.handler(
      {
        automationId: this.automation.getId(),
        actionAlias: TEST_ACTION_ALIAS,
        alias: TEST_STEP_ALIAS,
        name: "Delay Step",
        settings: { duration: RUN_FIXTURE_DELAY },
        inputMappings: undefined,
        errorBehavior: undefined,
        retryInterval: undefined,
        maxRetries: undefined,
      },
      createMockRequestHandlerExtra(),
    );
    await publishAutomationTool.handler({ id: this.automation.getId() }, createMockRequestHandlerExtra());

    return this;
  }

  getAutomationId(): string {
    if (!this.automation) {
      throw new Error("RunFixture not set up yet. Call setup() first.");
    }
    return this.automation.getId();
  }

  /** Triggers a brand new run of the fixture automation and returns its id. */
  async triggerRun(): Promise<string> {
    if (!this.automation) {
      throw new Error("RunFixture not set up yet. Call setup() first.");
    }

    await triggerAutomationTool.handler({ id: this.automation.getId() }, createMockRequestHandlerExtra());

    const client = getUmbracoAutomateManagementAPI();
    const response = (await client.getAutomationsByIdRuns(
      this.automation.getId(),
      { skip: 0, take: 1 },
      CAPTURE_RAW_HTTP_RESPONSE,
    )) as unknown as HttpResponse<{ items: AutomationRunResponseModel[] }>;

    const run = response.data?.items?.[0];
    if (!run) {
      throw new Error("Failed to find the run created by trigger-automation.");
    }

    this.runId = run.id;
    return run.id;
  }

  getRunId(): string {
    if (!this.runId) {
      throw new Error("No run triggered yet. Call triggerRun() first.");
    }
    return this.runId;
  }

  /** Best-effort teardown: cancel any leftover run, then delete the automation and workspace. */
  async cleanup(): Promise<void> {
    if (this.automation) {
      await this.automation.delete();
    }
    if (this.workspace) {
      await this.workspace.delete();
    }
  }
}
