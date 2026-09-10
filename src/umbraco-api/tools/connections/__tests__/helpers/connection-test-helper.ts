import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE } from "@umbraco-cms/mcp-server-sdk";

export class ConnectionTestHelper {
  static async findByAlias(alias: string): Promise<any | undefined> {
    const client = getUmbracoAutomateManagementAPI();
    const response: any = await client.getConnections(
      { filter: alias, take: 100 },
      CAPTURE_RAW_HTTP_RESPONSE,
    );
    const items = response.data?.items ?? [];
    return items.find((item: any) => item.alias === alias);
  }

  static async cleanup(aliasPrefix: string): Promise<void> {
    const client = getUmbracoAutomateManagementAPI();
    const response: any = await client.getConnections(
      { filter: aliasPrefix, take: 100 },
      CAPTURE_RAW_HTTP_RESPONSE,
    );
    const items = response.data?.items ?? [];
    for (const item of items) {
      if (item.alias?.startsWith(aliasPrefix)) {
        try {
          await client.deleteConnectionsById(item.id, CAPTURE_RAW_HTTP_RESPONSE);
        } catch {
          // Ignore cleanup failures
        }
      }
    }
  }

  static normalizeIds(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeIds(item));
    }
    if (data && typeof data === "object") {
      const normalized = { ...data };
      if (normalized.id) {
        normalized.id = "00000000-0000-0000-0000-000000000000";
      }
      for (const key of Object.keys(normalized)) {
        if (typeof normalized[key] === "object") {
          normalized[key] = this.normalizeIds(normalized[key]);
        }
      }
      return normalized;
    }
    return data;
  }
}
