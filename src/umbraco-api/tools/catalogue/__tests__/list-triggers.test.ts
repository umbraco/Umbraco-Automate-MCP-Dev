import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueTriggersTool from "../get/list-triggers.js";

describe("list-catalogue-triggers", () => {
  setupTestEnvironment();

  it("should list available trigger definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueTriggersTool.handler(
      { workspaceId: undefined },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueTriggersTool.handler(
      { workspaceId: "not-a-guid" },
      context
    );

    expect(result.isError).toBe(true);
  });
});
