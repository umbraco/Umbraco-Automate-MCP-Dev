/**
 * API Client Configuration
 *
 * This file sets up the HTTP client used by generated API code (the Orval
 * `mutator` configured in orval.config.ts - every generated method in
 * src/umbraco-api/api/generated/*.ts calls `customInstance` directly).
 *
 * Delegates to the SDK's UmbracoManagementClient for all real API calls.
 * Integration and eval tests both run against the real Umbraco instance
 * (see .env / tests/evals/helpers/e2e-setup.ts) rather than a mocked one.
 */

import {
  UmbracoManagementClient,
  type HttpResponse,
} from "@umbraco-cms/mcp-server-sdk";

interface RequestConfig {
  method?: string;
  url?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Custom fetch-based instance for API calls. Used by Orval-generated code.
 * Delegates to the SDK's UmbracoManagementClient, which handles auth and
 * the real HTTP request/response cycle.
 */
export const customInstance = async <T>(
  config: RequestConfig,
  options?: RequestConfig
): Promise<HttpResponse<T> | T> => {
  const mergedConfig = { ...config, ...options };
  return UmbracoManagementClient<T>(mergedConfig as any, mergedConfig as any);
};

export default customInstance;

/**
 * Pass this as the options parameter to capture the full HTTP response
 * instead of just the response data.
 */
export const CAPTURE_RAW_HTTP_RESPONSE = { returnFullResponse: true };
