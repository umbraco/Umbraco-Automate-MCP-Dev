import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  RunFixture,
} from "../setup.js";
import getRunByIdTool from "../../get/get-run-by-id.js";

describe("RunFixture", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  afterEach(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should trigger a real, published automation and produce a Running run", async () => {
    fixture = await new RunFixture().setup();

    const runId = await fixture.triggerRun();
    expect(runId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    const result = await getRunByIdTool.handler({ id: runId }, createMockRequestHandlerExtra());
    expect(result.isError).toBeFalsy();
    expect((result.structuredContent as { status: string }).status).toBe("Running");
  }, 30000);
});
