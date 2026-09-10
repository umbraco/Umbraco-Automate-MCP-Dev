import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  RunFixture,
} from "./setup.js";
import terminateRunTool from "../post/terminate-run.js";
import replayRunTool from "../post/replay-run.js";

describe("replay-run", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should re-execute a finished run as a new run, once the run has reached a terminal status", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    // terminate-run reliably moves a Running run to the terminal status "Cancelled" -
    // replay-run requires a terminal status first.
    const terminate = await terminateRunTool.handler({ id: runId }, context);
    expect(terminate.isError).toBeFalsy();

    const result = await replayRunTool.handler({ id: runId }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  }, 30000);

  it("should return an error when replaying a run that has not reached a terminal status", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    // Fresh run from triggerRun() is Running, not terminal.
    const result = await replayRunTool.handler({ id: runId }, context);

    expect(result.isError).toBe(true);
  }, 30000);
});
