import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  RunFixture,
} from "./setup.js";
import terminateRunTool from "../post/terminate-run.js";
import getRunByIdTool from "../get/get-run-by-id.js";

describe("terminate-run", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should force-stop a run that is currently Running, marking it Cancelled", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    const result = await terminateRunTool.handler({ id: runId }, context);

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();

    const postCheck = await getRunByIdTool.handler({ id: runId }, context);
    expect((postCheck.structuredContent as { status: string }).status).toBe("Cancelled");
  }, 30000);

  it("should return an error when terminating a run that is already terminal", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    const first = await terminateRunTool.handler({ id: runId }, context);
    expect(first.isError).toBeFalsy();

    const result = await terminateRunTool.handler({ id: runId }, context);

    expect(result.isError).toBe(true);
  }, 30000);
});
