import { describe, it } from "@jest/globals";
import {
  runScenarioTest,
  setupConsoleMock,
  getDefaultTimeoutMs,
} from "@umbraco-cms/mcp-server-sdk/evals";

const WORKSPACE_TOOLS = [
  "list-workspaces",
  "get-workspace",
  "create-workspace",
  "update-workspace",
  "delete-workspace",
] as const;

describe("Workspaces CRUD Operations", () => {
  setupConsoleMock();
  const timeout = getDefaultTimeoutMs();

  it(
    "should complete full CRUD workflow",
    runScenarioTest({
      prompt: `Complete these tasks in order. IMPORTANT: use only the tools named exactly "list-workspaces", "get-workspace", "create-workspace", "update-workspace", "delete-workspace" (no other prefix or namespace) - do not use any tool whose name is prefixed with "mcp__umbraco__" or similar, even if it looks like it does the same thing.
1. Generate a unique identifier using the current timestamp (call it {timestamp}).
2. Create a new workspace with alias "eval-workspace-{timestamp}", name "Eval Workspace {timestamp}", and serviceAccountKey "92bce462-d4b4-441f-9056-17f283f63cc8" (this is a real Umbraco user id already known to be valid on this instance - use it exactly as given, do not look up or guess a different one).
3. List workspaces filtering by the name "Eval Workspace {timestamp}" and confirm the one you created appears in the results, noting its id.
4. Get the workspace you created by its id to verify the details, and note its current "version" value from the response.
5. Update the workspace by its id: change its name to "Updated Eval Workspace {timestamp}", keep the alias and serviceAccountKey the same, and pass the "version" value you got from step 4.
6. Delete the workspace you created by its id.
7. Say "Workspace CRUD workflow completed successfully"`,
      tools: [...WORKSPACE_TOOLS],
      requiredTools: [
        "create-workspace",
        "list-workspaces",
        "get-workspace",
        "update-workspace",
        "delete-workspace",
      ],
      successPattern: "Workspace CRUD workflow completed successfully",
      verbose: false,
    }),
    timeout
  );
});
