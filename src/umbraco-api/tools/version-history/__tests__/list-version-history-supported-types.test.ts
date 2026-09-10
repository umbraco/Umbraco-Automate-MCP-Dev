import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listVersionHistorySupportedTypesTool from "../get/list-version-history-supported-types.js";

describe("list-version-history-supported-types", () => {
  setupTestEnvironment();

  it("should list the supported entityType values", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listVersionHistorySupportedTypesTool.handler(
      undefined as never,
      context,
    );

    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
