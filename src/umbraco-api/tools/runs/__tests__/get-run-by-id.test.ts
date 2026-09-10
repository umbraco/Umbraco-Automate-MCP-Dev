import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  RunFixture,
  RunTestHelper,
} from "./setup.js";
import getRunByIdTool from "../get/get-run-by-id.js";

describe("get-run-by-id", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should return the full detail of a run by id, including its step-by-step state", async () => {
    fixture = await new RunFixture().setup();
    const runId = await fixture.triggerRun();
    const context = createMockRequestHandlerExtra();

    const result = await getRunByIdTool.handler({ id: runId }, context);

    expect(result.isError).toBeFalsy();
    const snapshot = createSnapshotResult(result, runId);
    expect(RunTestHelper.normalizeIds(snapshot)).toMatchSnapshot();
  }, 30000);

  it("should return an error for a non-existent run id", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await getRunByIdTool.handler(
      { id: "00000000-0000-0000-0000-000000000000" },
      context,
    );

    expect(result.isError).toBe(true);
  });
});
