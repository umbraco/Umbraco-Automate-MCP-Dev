import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  AutomationBuilder,
  WorkspaceBuilder,
} from "./setup.js";
import reEnableAutomationTool from "../post/re-enable-automation.js";

const TEST_WORKSPACE_ALIAS = "_testWsAuto_reEnable";
const TEST_ALIAS = "_test_re_enable_automation";

describe("re-enable-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;
  let automation: AutomationBuilder;

  beforeAll(async () => {
    workspace = await new WorkspaceBuilder()
      .withAlias(TEST_WORKSPACE_ALIAS)
      .withName("_Test Workspace Auto Re-enable")
      .create();
  });

  afterAll(async () => {
    await workspace.delete();
  });

  beforeEach(async () => {
    automation = await new AutomationBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Re-enable Automation")
      .withWorkspaceId(workspace.getId())
      .create();
  });

  afterEach(async () => {
    await automation.delete();
  });

  it("should re-enable an automation (a no-op when it isn't currently disabled)", async () => {
    // This instance has no way to force an automation into health=Disabled from a test (that
    // only happens after repeated real run failures), so this exercises the tool's happy path
    // against a healthy automation - the endpoint itself doesn't reject that, it's just a no-op.
    const context = createMockRequestHandlerExtra();

    const result = await reEnableAutomationTool.handler({ id: automation.getId() }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a non-existent id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await reEnableAutomationTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
