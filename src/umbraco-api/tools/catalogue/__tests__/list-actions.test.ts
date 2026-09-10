import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueActionsTool from "../get/list-actions.js";

describe("list-catalogue-actions", () => {
  setupTestEnvironment();

  it("should list available action step definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueActionsTool.handler(
      { workspaceId: undefined },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for a malformed workspaceId", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueActionsTool.handler(
      { workspaceId: "not-a-guid" },
      context
    );

    expect(result.isError).toBe(true);
  });
});
