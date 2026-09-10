import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import resolveStepTypeOutputSchemaTool from "../post/resolve-step-type-output-schema.js";

// "umbracoAutomate.runScript" is the one action in this instance's catalogue with
// hasDynamicOutputSchema: true (see list-catalogue-actions) — its output shape depends
// on the "outputSchema" setting supplied here, which is exactly the case this tool
// exists to resolve.
describe("resolve-step-type-output-schema", () => {
  setupTestEnvironment();

  it("should resolve the dynamic output schema for a configured step", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await resolveStepTypeOutputSchemaTool.handler(
      {
        alias: "umbracoAutomate.runScript",
        settings: {
          script:
            "export default function (data) { return { upper: data.name.toUpperCase() }; }",
          outputSchema: JSON.stringify({
            type: "object",
            properties: { upper: { type: "string" } },
          }),
          allowFetch: false,
        },
      },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  it("should return an error for an unknown step type alias", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await resolveStepTypeOutputSchemaTool.handler(
      {
        alias: "umbracoAutomate.doesNotExist",
        settings: {},
      },
      context
    );

    expect(result.isError).toBe(true);
  });
});
