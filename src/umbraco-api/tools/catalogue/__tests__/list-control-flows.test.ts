import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueControlFlowsTool from "../get/list-control-flows.js";

describe("list-catalogue-control-flows", () => {
  setupTestEnvironment();

  it("should list available control-flow step definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueControlFlowsTool.handler(
      undefined as never,
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
