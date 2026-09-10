/**
 * Workspaces Tool Collection
 *
 * Workspaces are the top-level containers that scope automations: each
 * workspace defines which service account its automations run as, which
 * connections they may use, and which Umbraco user groups can manage it.
 * Within a workspace, groups act as folders for organizing automations
 * (see `automations/groups/{groupId}` in the automations collection to list
 * the automations filed under a group).
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import listWorkspacesTool from "./get/list-workspaces.js";
import getWorkspaceTool from "./get/get-workspace.js";
import listWorkspaceGroupsTool from "./get/list-workspace-groups.js";
import getWorkspaceGroupTool from "./get/get-workspace-group.js";
import createWorkspaceTool from "./post/create-workspace.js";
import createWorkspaceGroupTool from "./post/create-workspace-group.js";
import updateWorkspaceTool from "./put/update-workspace.js";
import updateWorkspaceGroupTool from "./put/update-workspace-group.js";
import deleteWorkspaceTool from "./delete/delete-workspace.js";
import deleteWorkspaceGroupTool from "./delete/delete-workspace-group.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "workspaces",
    displayName: "Workspaces",
    description:
      "Manage workspaces (the top-level containers that scope automations, their allowed connections, and permitted user groups) and the groups used to organize automations within them.",
  },
  tools: () => [
    // Read operations
    listWorkspacesTool,
    getWorkspaceTool,
    listWorkspaceGroupsTool,
    getWorkspaceGroupTool,
    // Create operations
    createWorkspaceTool,
    createWorkspaceGroupTool,
    // Update operations
    updateWorkspaceTool,
    updateWorkspaceGroupTool,
    // Delete operations
    deleteWorkspaceTool,
    deleteWorkspaceGroupTool,
  ],
};

export default collection;
