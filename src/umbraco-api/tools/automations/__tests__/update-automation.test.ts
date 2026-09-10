import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  WorkspaceBuilder,
} from "./setup.js";
import updateAutomationTool from "../put/update-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_update";
const TEST_ALIAS = "_test_update_automation";

describe("update-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Update")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  afterEach(async () => {
    if (automation) await automation.delete();
  });

  it("should rename an automation, leaving the rest of its definition unchanged", async () => {
    const context = createMockRequestHandlerExtra();
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Update Automation")
      .withWorkspaceId(workspace.getId())
      .create();

    const result = await updateAutomationTool.handler(
      {
        automationId: automation.getId(),
        alias: undefined,
        name: "_Test Update Automation Renamed",
        description: undefined,
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a non-existent automationId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await updateAutomationTool.handler(
      {
        automationId: "00000000-0000-0000-0000-000000000000",
        alias: undefined,
        name: "Doesn't matter",
        description: undefined,
        groupId: undefined,
      },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
