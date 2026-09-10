import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueStepTypesTool from "../get/list-step-types.js";

describe("list-catalogue-step-types", () => {
  setupTestEnvironment();

  it("should list all step type definitions across every category", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueStepTypesTool.handler(
      { type: undefined },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should filter step types by a single category", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueStepTypesTool.handler(
      { type: "action" },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
