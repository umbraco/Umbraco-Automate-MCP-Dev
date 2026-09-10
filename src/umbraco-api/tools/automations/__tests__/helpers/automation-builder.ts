import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE, type HttpResponse } from "@umbraco-cms/mcp-server-sdk";
import type { CreateAutomationRequestModel } from "../../../../api/generated/umbracoAutomateManagementApi.js";

export const TEST_AUTOMATION_ALIAS = "_testAutomation";
export const TEST_AUTOMATION_NAME = "_Test Automation";

// A catalogue action with no connectionTypeAlias requirement, so add-automation-step /
// update-automation-step tests don't need a connection fixture too. Confirmed against the
// real instance's GET /catalogue/actions.
export const TEST_ACTION_ALIAS = "umbracoAutomate.delay";
export const TEST_ACTION_SETTINGS = { duration: "00:00:05" };

// The only trigger with no settingsSchema at all (settingsSchema: null), so `settings` can
// be omitted entirely. supportsManualRun is also true, making it usable with
// trigger-automation. Confirmed against the real instance's GET /catalogue/triggers.
export const TEST_TRIGGER_ALIAS = "umbracoAutomate.manual";

// Step aliases (unlike the automation's own `alias`) must start with a letter and contain
// only letters and digits - no hyphens/underscores - per the API's own validation
// ("Step 'X' has invalid alias 'y-z'..."), confirmed against the real instance.
export const TEST_STEP_ALIAS = "delayStep";
export const TEST_STEP_ALIAS_2 = "delayStepTwo";

interface AutomationModel {
  alias: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  groupId?: string | null;
}

export class AutomationBuilder {
  private model: AutomationModel = {
    alias: TEST_AUTOMATION_ALIAS,
    name: TEST_AUTOMATION_NAME,
    workspaceId: "",
  };

  private createdId?: string;

  withAlias(alias: string): this {
    this.model.alias = alias;
    return this;
  }

  withName(name: string): this {
    this.model.name = name;
    return this;
  }

  withDescription(description: string | null): this {
    this.model.description = description;
    return this;
  }

  withWorkspaceId(workspaceId: string): this {
    this.model.workspaceId = workspaceId;
    return this;
  }

  withGroupId(groupId: string | null): this {
    this.model.groupId = groupId;
    return this;
  }

  build(): AutomationModel {
    return { ...this.model };
  }

  async create(): Promise<this> {
    if (!this.model.workspaceId) {
      throw new Error("Automation requires a workspaceId - call withWorkspaceId() first.");
    }

    const client = getUmbracoAutomateManagementAPI();
    const body: CreateAutomationRequestModel = {
      alias: this.model.alias,
      name: this.model.name,
      description: this.model.description ?? null,
      workspaceId: this.model.workspaceId,
      groupId: this.model.groupId ?? null,
      trigger: null,
      steps: [],
      connections: [],
      canvasState: null,
      notificationSettings: null,
    };

    const response = (await client.postAutomations(
      body,
      CAPTURE_RAW_HTTP_RESPONSE,
    )) as unknown as HttpResponse;

    if (response.status !== 201) {
      const errorBody = (response.data as Record<string, unknown> | undefined)?.detail;
      throw new Error(`Failed to create automation: ${errorBody || `HTTP ${response.status}`}`);
    }

    const location = response.headers?.Location || response.headers?.location;
    this.createdId = location?.split("/").pop();

    return this;
  }

  async delete(): Promise<void> {
    if (!this.createdId) return;
    const client = getUmbracoAutomateManagementAPI();
    try {
      await client.deleteAutomationsById(this.createdId, CAPTURE_RAW_HTTP_RESPONSE);
    } catch {
      // Ignore delete failures in cleanup
    }
    this.createdId = undefined;
  }

  getId(): string {
    if (!this.createdId) {
      throw new Error("Automation not created yet. Call create() first.");
    }
    return this.createdId;
  }

  getAlias(): string {
    return this.model.alias;
  }
}
