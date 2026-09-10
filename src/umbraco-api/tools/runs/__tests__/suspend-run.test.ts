import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  RunFixture,
} from "./setup.js";
import suspendRunTool from "../post/suspend-run.js";
import getRunByIdTool from "../get/get-run-by-id.js";

describe("suspend-run", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should suspend a run that is currently Running", async () => {
    // Confirmed against the real instance: a run driven by a long-enough umbracoAutomate.delay
    // step stays in status "Running" for the whole delay, giving a real window to suspend it -
    // this is not a fabricated/simulated status.
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    const preCheck = await getRunByIdTool.handler({ id: runId }, context);
    expect((preCheck.structuredContent as { status: string }).status).toBe("Running");

    const result = await suspendRunTool.handler({ id: runId }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const postCheck = await getRunByIdTool.handler({ id: runId }, context);
    expect((postCheck.structuredContent as { status: string }).status).toBe("Suspended");
  }, 30000);

  it("should return an error when suspending a run that is already Suspended", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    // Suspend it once for real (valid: Pending/Running), then confirm a second suspend-run
    // call is rejected because the run is no longer in a suspendable status.
    const first = await suspendRunTool.handler({ id: runId }, context);
    expect(first.isError).toBeFalsy();

    const result = await suspendRunTool.handler({ id: runId }, context);

    expect(result.isError).toBe(true);
  }, 30000);
});
