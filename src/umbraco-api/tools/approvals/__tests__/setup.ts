import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "@umbraco-cms/mcp-server-sdk/testing";
import { configureApiClient, initializeUmbracoFetch } from "@umbraco-cms/mcp-server-sdk";
import { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";

// approvals has no create/delete tools of its own - pending approvals only exist as a
// side effect of a real automation run pausing on an approval step. Test data for the
// decide-approval-step happy path is built by reusing the automations/workspaces
// collections' own (already-validated) builders directly in that test file.

// Initialize fetch with credentials — required for integration tests hitting the real API
initializeUmbracoFetch({
  baseUrl: process.env.UMBRACO_BASE_URL!,
  clientId: process.env.UMBRACO_CLIENT_ID!,
  clientSecret: process.env.UMBRACO_CLIENT_SECRET!,
});

configureApiClient(() => getUmbracoAutomateManagementAPI());

export { setupTestEnvironment, createMockRequestHandlerExtra, createSnapshotResult };
