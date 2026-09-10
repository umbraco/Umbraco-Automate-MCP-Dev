import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  RunFixture,
} from "./setup.js";
import suspendRunTool from "../post/suspend-run.js";
import resumeRunTool from "../post/resume-run.js";
import getRunByIdTool from "../get/get-run-by-id.js";

describe("resume-run", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should resume a run that is currently Suspended", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    // Get a genuinely Suspended run via suspend-run (confirmed against the real instance:
    // suspend-run reliably moves a Running run to Suspended).
    const suspend = await suspendRunTool.handler({ id: runId }, context);
    expect(suspend.isError).toBeFalsy();

    const result = await resumeRunTool.handler({ id: runId }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const postCheck = await getRunByIdTool.handler({ id: runId }, context);
    expect((postCheck.structuredContent as { status: string }).status).toBe("Running");
  }, 30000);

  it("should return an error when resuming a run that is not Suspended", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    // Fresh run from triggerRun() is Running, not Suspended.
    const result = await resumeRunTool.handler({ id: runId }, context);

    expect(result.isError).toBe(true);
  }, 30000);
});
