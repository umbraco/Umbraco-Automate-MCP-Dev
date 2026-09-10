import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import getMetricsTool from "../get/get-metrics.js";
import { WorkspaceBuilder } from "../../workspaces/__tests__/helpers/workspace-builder.js";

describe("get-metrics", () => {
  setupTestEnvironment();

  let workspace: WorkspaceBuilder;

  afterEach(async () => {
    if (workspace) await workspace.delete();
  });

  it("should return overall run metrics in the empty-state shape, scoped to a fresh workspace with no runs", async () => {
    // Scoped by workspaceId to a brand-new, empty workspace rather than
    // asserting a global zero-runs state - other collections' tests create
    // real runs, so an unscoped call here would be flaky.
    workspace = await new WorkspaceBuilder()
      .withAlias(`_testMetricsWorkspace${Date.now()}`)
      .withName("_Test Metrics Workspace")
      .create();
    const context = createMockRequestHandlerExtra();

    const result = await getMetricsTool.handler(
      { workspaceId: workspace.getId(), from: undefined, to: undefined },
      context,
    );

    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getMetricsTool.handler(
      { workspaceId: "not-a-guid" } as any,
      context,
    );

    expect(result.isError).toBe(true);
  });
});
