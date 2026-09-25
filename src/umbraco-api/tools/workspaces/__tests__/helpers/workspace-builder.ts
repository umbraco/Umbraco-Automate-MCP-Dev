import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import {
  CAPTURE_RAW_HTTP_RESPONSE,
  UmbracoManagementClient,
  type HttpResponse,
} from "@umbraco-cms/mcp-server-sdk";

export const TEST_WORKSPACE_ALIAS = "_testWorkspace";
export const TEST_WORKSPACE_NAME = "_Test Workspace";

/**
 * Workspaces require a serviceAccountKey referencing a real Umbraco user - some Automate
 * versions (18.2, for one) refuse to publish automations in a workspace whose service
 * account doesn't exist. This collection has no tool that looks one up, so default to the "Api"
 * kind user behind the OAuth client credentials the tests authenticate with, which exists
 * on every instance the tests can reach. Override with TEST_SERVICE_ACCOUNT_KEY if needed.
 */
let serviceAccountKey: Promise<string> | undefined;

export function getTestServiceAccountKey(): Promise<string> {
  serviceAccountKey ??= process.env.TEST_SERVICE_ACCOUNT_KEY
    ? Promise.resolve(process.env.TEST_SERVICE_ACCOUNT_KEY)
    : (
        UmbracoManagementClient<{ id: string }>(
          { method: "GET", url: "/umbraco/management/api/v1/user/current" },
          CAPTURE_RAW_HTTP_RESPONSE,
        ) as unknown as Promise<HttpResponse<{ id: string }>>
      ).then((response) => {
        if (response.status !== 200 || !response.data?.id) {
          throw new Error(`Failed to resolve the current API user: HTTP ${response.status}`);
        }
        return response.data.id;
      });
  return serviceAccountKey;
}

interface WorkspaceModel {
  alias: string;
  name: string;
  serviceAccountKey?: string;
  userGroups: string[];
  allowedConnections: string[];
}

export class WorkspaceBuilder {
  private model: WorkspaceModel = {
    alias: TEST_WORKSPACE_ALIAS,
    name: TEST_WORKSPACE_NAME,
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
      {
        ...this.model,
        serviceAccountKey: this.model.serviceAccountKey ?? (await getTestServiceAccountKey()),
      },
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
