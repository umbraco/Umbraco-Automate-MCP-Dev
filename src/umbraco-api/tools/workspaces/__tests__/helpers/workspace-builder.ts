import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE, type HttpResponse } from "@umbraco-cms/mcp-server-sdk";

export const TEST_WORKSPACE_ALIAS = "_testWorkspace";
export const TEST_WORKSPACE_NAME = "_Test Workspace";

/**
 * The instance under test currently has exactly one real Umbraco user: the
 * "Api" kind user backing the OAuth client credentials this project's .env
 * authenticates with (found via GET /umbraco/management/api/v1/user on the
 * connected instance). Workspaces require a serviceAccountKey referencing a
 * real Umbraco user, and this collection has no tool that looks one up, so
 * the builder defaults to that user's id. Override with
 * TEST_SERVICE_ACCOUNT_KEY if the instance changes.
 */
export const TEST_SERVICE_ACCOUNT_KEY =
  process.env.TEST_SERVICE_ACCOUNT_KEY ?? "92bce462-d4b4-441f-9056-17f283f63cc8";

interface WorkspaceModel {
  alias: string;
  name: string;
  serviceAccountKey: string;
  userGroups: string[];
  allowedConnections: string[];
}

export class WorkspaceBuilder {
  private model: WorkspaceModel = {
    alias: TEST_WORKSPACE_ALIAS,
    name: TEST_WORKSPACE_NAME,
    serviceAccountKey: TEST_SERVICE_ACCOUNT_KEY,
    userGroups: [],
    allowedConnections: [],
  };

  private createdId?: string;

  withAlias(alias: string): this {
    this.model.alias = alias;
    return this;
  }

  withName(name: string): this {
    this.model.name = name;
    return this;
  }

  withServiceAccountKey(serviceAccountKey: string): this {
    this.model.serviceAccountKey = serviceAccountKey;
    return this;
  }

  withUserGroups(userGroups: string[]): this {
    this.model.userGroups = userGroups;
    return this;
  }

  withAllowedConnections(allowedConnections: string[]): this {
    this.model.allowedConnections = allowedConnections;
    return this;
  }

  build(): WorkspaceModel {
    return { ...this.model };
  }

  async create(): Promise<this> {
    const client = getUmbracoAutomateManagementAPI();
    const response = (await client.postWorkspaces(
      this.model,
      CAPTURE_RAW_HTTP_RESPONSE
    )) as HttpResponse;

    if (response.status !== 201) {
      const errorBody = (response.data as Record<string, unknown> | undefined)?.detail;
      throw new Error(`Failed to create workspace: ${errorBody || `HTTP ${response.status}`}`);
    }

    const location = response.headers?.Location || response.headers?.location;
    this.createdId = location?.split("/").pop();

    return this;
  }

  async delete(): Promise<void> {
    if (!this.createdId) return;
    const client = getUmbracoAutomateManagementAPI();
    try {
      await client.deleteWorkspacesById(this.createdId, CAPTURE_RAW_HTTP_RESPONSE);
    } catch {
      // Ignore delete failures in cleanup
    }
    this.createdId = undefined;
  }

  getId(): string {
    if (!this.createdId) {
      throw new Error("Workspace not created yet. Call create() first.");
    }
    return this.createdId;
  }

  getAlias(): string {
    return this.model.alias;
  }
}
