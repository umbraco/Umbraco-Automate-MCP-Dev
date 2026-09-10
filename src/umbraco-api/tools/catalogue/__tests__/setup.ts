import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "@umbraco-cms/mcp-server-sdk/testing";
import { configureApiClient } from "@umbraco-cms/mcp-server-sdk";
import { getUmbracoAutomateManagementAPI } from "../../../api/generated/umbracoAutomateManagementApi.js";

// initializeUmbracoFetch is already called globally in jest.setup.ts using
// credentials loaded from .env — no need to call it again here.

configureApiClient(() => getUmbracoAutomateManagementAPI());

export { setupTestEnvironment, createMockRequestHandlerExtra, createSnapshotResult };
