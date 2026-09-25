import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "@umbraco-cms/mcp-server-sdk/testing";
import { configureApiClient, initializeUmbracoFetch } from "@umbraco-cms/mcp-server-sdk";
import { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
import { setUmbracoBaseUrl } from "../../../../config/umbraco-base-url.js";
import { AutomationBuilder } from "./helpers/automation-builder.js";
import { AutomationTestHelper } from "./helpers/automation-test-helper.js";
// Reused, already-validated fixture builder from the workspaces collection - automations
// only exist inside a workspace, and this collection has no create-workspace tool of its own.
import { WorkspaceBuilder } from "../../workspaces/__tests__/helpers/workspace-builder.js";
import { WorkspaceGroupBuilder } from "../../workspaces/__tests__/helpers/workspace-group-builder.js";

// Initialize fetch with credentials — required for integration tests hitting the real API
initializeUmbracoFetch({
  baseUrl: process.env.UMBRACO_BASE_URL!,
  clientId: process.env.UMBRACO_CLIENT_ID!,
  clientSecret: process.env.UMBRACO_CLIENT_SECRET!,
});
// Mirrors src/index.ts, for tools that build absolute URLs the API doesn't return.
setUmbracoBaseUrl(process.env.UMBRACO_BASE_URL);

configureApiClient(() => getUmbracoAutomateManagementAPI());

export {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  WorkspaceGroupBuilder,
};

export {
  TEST_AUTOMATION_ALIAS,
  TEST_AUTOMATION_NAME,
  TEST_ACTION_ALIAS,
  TEST_ACTION_SETTINGS,
  TEST_TRIGGER_ALIAS,
  TEST_STEP_ALIAS,
  TEST_STEP_ALIAS_2,
} from "./helpers/automation-builder.js";
