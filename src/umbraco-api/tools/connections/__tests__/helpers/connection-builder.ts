import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE } from "@umbraco-cms/mcp-server-sdk";

// This Umbraco instance's connection-types catalogue (GET /catalogue/connection-types)
// is empty — no connection-type provider packages are installed. The connections API
// itself does not validate `type` against the catalogue at create/update time (confirmed
// against the real instance), so tests use an arbitrary-but-realistic type/settings shape
// rather than a fabricated alias that claims to match a real provider. Because "http" has
// no registered provider, test-connection will correctly report Failure — that is asserted
// as the expected outcome, not treated as a tool bug.
export const TEST_CONNECTION_ALIAS = "_test_connection";
export const TEST_CONNECTION_NAME = "_Test Connection";
export const TEST_CONNECTION_TYPE = "http";

interface ConnectionSettings {
  baseUrl: string;
  apiKey: string;
}

interface ConnectionModel {
  alias: string;
  name: string;
  type: string;
  settings: ConnectionSettings;
}

export class ConnectionBuilder {
  private model: ConnectionModel = {
    alias: TEST_CONNECTION_ALIAS,
    name: TEST_CONNECTION_NAME,
    type: TEST_CONNECTION_TYPE,
    settings: {
      baseUrl: "https://example.invalid",
      apiKey: "secret-value-123",
    },
  };

  private createdId?: string;
  private currentVersion = 1;

  withAlias(alias: string): this {
    this.model.alias = alias;
    return this;
  }

  withName(name: string): this {
    this.model.name = name;
    return this;
  }

  withType(type: string): this {
    this.model.type = type;
    return this;
  }

  withSettings(settings: ConnectionSettings): this {
    this.model.settings = settings;
    return this;
  }

  build(): ConnectionModel {
    return { ...this.model };
  }

  async create(): Promise<this> {
    const client = getUmbracoAutomateManagementAPI();
    const response: any = await client.postConnections(
      this.model as any,
      CAPTURE_RAW_HTTP_RESPONSE,
    );

    if (response.status !== 201) {
      const errorBody = response.data?.detail || `HTTP ${response.status}`;
      throw new Error(`Failed to create connection: ${errorBody}`);
    }

    const location =
      response.headers?.get?.("location") || response.headers?.["location"];
    this.createdId = location?.split("/").pop();
    this.currentVersion = 1;

    return this;
  }

  async delete(): Promise<void> {
    if (!this.createdId) return;
    const client = getUmbracoAutomateManagementAPI();
    try {
      await client.deleteConnectionsById(this.createdId, CAPTURE_RAW_HTTP_RESPONSE);
    } catch {
      // Ignore delete failures in cleanup
    }
    this.createdId = undefined;
  }

  getId(): string {
    if (!this.createdId) {
      throw new Error("Connection not created yet. Call create() first.");
    }
    return this.createdId;
  }

  getVersion(): number {
    return this.currentVersion;
  }
}
