import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import getMetricsByAutomationTool from "../get/get-metrics-by-automation.js";
import { WorkspaceBuilder } from "../../workspaces/__tests__/helpers/workspace-builder.js";

describe("get-metrics-by-automation", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;

  afterEach(async () => {
    if (workspace) await workspace.delete();
  });

  it("should return an empty items list, scoped to a fresh workspace with no automations", async () => {
    // Scoped by workspaceId to a brand-new, empty workspace rather than
    // asserting a global empty state - other collections' tests create real
    // automations/runs, so an unscoped call here would be flaky.
    workspace = await new WorkspaceBuilder()
      .withAlias(`_testMetricsByAutoWorkspace${Date.now()}`)
      .withName("_Test Metrics By Automation Workspace")
      .create();
    const context = createMockRequestHandlerExtra();

    const result = await getMetricsByAutomationTool.handler(
      { workspaceId: workspace.getId(), from: undefined, to: undefined, take: 10 },
      context,
    );

    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getMetricsByAutomationTool.handler(
      { workspaceId: "not-a-guid", from: undefined, to: undefined, take: 10 } as any,
      context,
    );

    expect(result.isError).toBe(true);
  });
});
