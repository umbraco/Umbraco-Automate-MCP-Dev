import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueConnectionTypesTool from "../get/list-connection-types.js";

describe("list-catalogue-connection-types", () => {
  setupTestEnvironment();

  it("should list available connection type definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueConnectionTypesTool.handler(
      undefined as never,
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
