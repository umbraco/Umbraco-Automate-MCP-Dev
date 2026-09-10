/**
 * Eval Test Setup
 *
 * Configures the eval test framework for this MCP server.
 * This runs before any tests via setupFilesAfterEnv in jest.config.ts.
 */

import path from "path";
import { configureEvals, ClaudeModels } from "@umbraco-cms/mcp-server-sdk/evals";

// Configure the eval framework for this MCP server.
//
// This project has no mock API layer - the Automate collections' eval tests
// run against the real, already-integration-tested Umbraco instance, using
// the same .env credentials as `npm test`.
configureEvals({
  // Path to the built MCP server
  mcpServerPath: path.resolve(process.cwd(), "dist/index.js"),

  // MCP server name (used in tool name prefixes like mcp__my-umbraco-mcp__tool-name)
  mcpServerName: "my-umbraco-mcp",

  // Real Umbraco instance credentials (from .env, same instance the
  // integration tests under src/umbraco-api/tools/*/__tests__ run against).
  // DISABLE_MCP_CHAINING=true prevents attempting to connect to chained MCP servers.
  serverEnv: {
    UMBRACO_CLIENT_ID: process.env.UMBRACO_CLIENT_ID || "",
    UMBRACO_CLIENT_SECRET: process.env.UMBRACO_CLIENT_SECRET || "",
    UMBRACO_BASE_URL: process.env.UMBRACO_BASE_URL || "",
    DISABLE_MCP_CHAINING: "true",
  },

  // Test defaults
  defaultModel: ClaudeModels.Haiku,
  defaultMaxTurns: 10,
  defaultMaxBudgetUsd: 0.25,
  defaultTimeoutMs: 60000,
});
