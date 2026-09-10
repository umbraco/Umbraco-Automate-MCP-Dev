import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE } from "@umbraco-cms/mcp-server-sdk";
import type { WorkspaceItemResponseModel } from "../../../../api/generated/umbracoAutomateManagementApi.js";

export class WorkspaceTestHelper {
  static async findByAlias(alias: string): Promise<WorkspaceItemResponseModel | undefined> {
    const client = getUmbracoAutomateManagementAPI();
    const response: any = await client.getWorkspaces(
      { filter: alias, skip: 0, take: 100 },
      CAPTURE_RAW_HTTP_RESPONSE
    );
    const items: WorkspaceItemResponseModel[] = response?.data?.items ?? [];
    return items.find((item) => item.alias === alias);
  }

  /** Deletes every workspace whose alias starts with the given prefix. */
  static async cleanup(aliasPrefix: string): Promise<void> {
    const client = getUmbracoAutomateManagementAPI();
    const response: any = await client.getWorkspaces(
      { filter: aliasPrefix, skip: 0, take: 100 },
      CAPTURE_RAW_HTTP_RESPONSE
    );
    const items: WorkspaceItemResponseModel[] = response?.data?.items ?? [];
    for (const item of items) {
      if (item.alias.startsWith(aliasPrefix)) {
        try {
          await client.deleteWorkspacesById(item.id, CAPTURE_RAW_HTTP_RESPONSE);
        } catch {
          // Ignore cleanup failures
        }
      }
    }
  }

  /**
   * createSnapshotResult (from the SDK testing helpers) only normalizes a
   * fixed list of date field names (created, createDate, publishDate, ...)
   * which doesn't include this collection's dateCreated/dateModified. Run
   * results through this afterward to strip those before snapshotting.
   */
  static normalizeIds(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeIds(item));
    }
    if (data && typeof data === "object") {
      const normalized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
      if (normalized.id) {
        normalized.id = "00000000-0000-0000-0000-000000000000";
      }
      if (normalized.workspaceId) {
        normalized.workspaceId = "00000000-0000-0000-0000-000000000000";
      }
      if (normalized.parentId) {
        normalized.parentId = "00000000-0000-0000-0000-000000000000";
      }
      if (normalized.dateCreated) {
        normalized.dateCreated = "NORMALIZED_DATE";
      }
      if (normalized.dateModified) {
        normalized.dateModified = "NORMALIZED_DATE";
      }
      for (const key of Object.keys(normalized)) {
        if (typeof normalized[key] === "object" && normalized[key] !== null) {
          normalized[key] = this.normalizeIds(normalized[key]);
        }
      }
      return normalized;
    }
    return data;
  }
}
