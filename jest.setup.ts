// Must be set before any TLS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import "./src/load-env.js";
import https from "node:https";
import { initializeUmbracoFetch } from "@umbraco-cms/mcp-server-sdk";

// Directly configure the global HTTPS agent to accept self-signed certs
// (process.env alone isn't sufficient in Jest's VM module context)
https.globalAgent.options.rejectUnauthorized = false;

// Override globalThis.fetch with undici, which is configured above to accept
// the real Umbraco instance's self-signed cert - all tests in this project
// (integration and eval) run against that real instance.
if (process.env.UMBRACO_BASE_URL) {
  const { Agent, setGlobalDispatcher, fetch: undiciFetch } = await import("undici");
  const agent = new Agent({ connect: { rejectUnauthorized: false } });
  setGlobalDispatcher(agent);
  globalThis.fetch = undiciFetch as typeof globalThis.fetch;
}

// Initialize the SDK's fetch client with real .env credentials.
// Without this, UmbracoManagementClient throws "not initialized" before the
// first real API call.
initializeUmbracoFetch({
  baseUrl: process.env.UMBRACO_BASE_URL || "http://localhost:9999",
  clientId: process.env.UMBRACO_CLIENT_ID || "test-client",
  clientSecret: process.env.UMBRACO_CLIENT_SECRET || "test-secret",
});
