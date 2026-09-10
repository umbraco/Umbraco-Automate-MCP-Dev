import { getUmbracoAutomateManagementAPI } from "../../../../api/generated/umbracoAutomateManagementApi.js";
import { CAPTURE_RAW_HTTP_RESPONSE, type HttpResponse } from "@umbraco-cms/mcp-server-sdk";

export const TEST_GROUP_NAME = "_Test Workspace Group";

interface WorkspaceGroupModel {
  workspaceId: string;
  name: string;
  parentId?: string | null;
}

export class WorkspaceGroupBuilder {
  private model: WorkspaceGroupModel;

  private createdId?: string;

  constructor(workspaceId: string) {
    this.model = {
      workspaceId,
      name: TEST_GROUP_NAME,
    };
  }

  withName(name: string): this {
    this.model.name = name;
    return this;
  }

  withParentId(parentId: string): this {
    this.model.parentId = parentId;
    return this;
  }

  build(): WorkspaceGroupModel {
    return { ...this.model };
  }

  async create(): Promise<this> {
    const client = getUmbracoAutomateManagementAPI();
    const response = (await client.postWorkspacesByIdGroups(
      this.model.workspaceId,
      { name: this.model.name, parentId: this.model.parentId },
      CAPTURE_RAW_HTTP_RESPONSE
    )) as HttpResponse;

    if (response.status !== 201) {
      const errorBody = (response.data as Record<string, unknown> | undefined)?.detail;
      throw new Error(
        `Failed to create workspace group: ${errorBody || `HTTP ${response.status}`}`
      );
    }

    const location = response.headers?.Location || response.headers?.location;
    this.createdId = location?.split("/").pop();

    return this;
  }

  async delete(): Promise<void> {
    if (!this.createdId) return;
    const client = getUmbracoAutomateManagementAPI();
    try {
      await client.deleteWorkspacesByIdGroupsByGroupId(
        this.model.workspaceId,
        this.createdId,
        CAPTURE_RAW_HTTP_RESPONSE
      );
    } catch {
      // Ignore delete failures in cleanup
    }
    this.createdId = undefined;
  }

  getId(): string {
    if (!this.createdId) {
      throw new Error("Workspace group not created yet. Call create() first.");
    }
    return this.createdId;
  }

  getWorkspaceId(): string {
    return this.model.workspaceId;
  }
}
