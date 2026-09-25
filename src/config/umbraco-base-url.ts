/**
 * The Umbraco base URL the stdio server's API client was initialized with.
 *
 * Set once by `src/index.ts`; tools that need an absolute URL the API doesn't
 * return read it here. Deliberately not set by the hosted Worker: it serves
 * several sites from one isolate, so a module-level value would leak one
 * request's site into another's — tools must treat `undefined` as "unknown".
 */
import { normalizeBaseUrl } from "@umbraco-cms/mcp-server-sdk";

let umbracoBaseUrl: string | undefined;

export function setUmbracoBaseUrl(baseUrl: string | undefined): void {
  umbracoBaseUrl = baseUrl ? normalizeBaseUrl(baseUrl) : undefined;
}

export function getUmbracoBaseUrl(): string | undefined {
  return umbracoBaseUrl;
}
