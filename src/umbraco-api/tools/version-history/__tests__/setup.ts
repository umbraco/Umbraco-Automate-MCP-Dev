import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "@umbraco-cms/mcp-server-sdk/testing";
import { configureApiClient, initializeUmbracoFetch } from "@umbraco-cms/mcp-server-sdk";
import { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";
// Reused, already-validated fixture builders/helpers from the automations and workspaces
// collections - version-history has no create tools of its own. It is a read-only /
// audit-trail feature layered over other entities (e.g. automations), so its own test
// fixtures come entirely from those collections.
import { AutomationBuilder } from "../../automations/__tests__/helpers/automation-builder.js";
import { AutomationTestHelper } from "../../automations/__tests__/helpers/automation-test-helper.js";
import { WorkspaceBuilder } from "../../workspaces/__tests__/helpers/workspace-builder.js";
import { VersionHistoryTestHelper } from "./helpers/version-history-test-helper.js";

// Initialize fetch with credentials — required for integration tests hitting the real API
initializeUmbracoFetch({
  baseUrl: process.env.UMBRACO_BASE_URL!,
  clientId: process.env.UMBRACO_CLIENT_ID!,
  clientSecret: process.env.UMBRACO_CLIENT_SECRET!,
});

configureApiClient(() => getUmbracoAutomateManagementAPI());

export {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  AutomationTestHelper,
  WorkspaceBuilder,
  VersionHistoryTestHelper,
};
