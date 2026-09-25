import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import { z } from "zod";
import resolveStepTypeOutputSchemaTool from "../post/resolve-step-type-output-schema.js";

// Uses core Umbraco.Automate step types so the tests don't depend on add-on packages
// (Umbraco.AI's Run AI Agent) being installed on the instance.
describe("resolve-step-type-output-schema", () => {
  setupTestEnvironment();

  // An MCP outputSchema must be an object schema. Calling the handler directly bypasses
  // the server's output validation, so a record schema (what Umbraco 17's spec generates
  // for this response) passes every other test here yet fails every real MCP call.
  it("should declare an object output schema that accepts its results", async () => {
    expect(resolveStepTypeOutputSchemaTool.outputSchema).toBeInstanceOf(z.ZodObject);

    const result = await resolveStepTypeOutputSchemaTool.handler(
      { alias: "umbracoAutomate.logMessage", settings: { message: "Hello" } },
      createMockRequestHandlerExtra()
    );
    expect(resolveStepTypeOutputSchemaTool.outputSchema.safeParse(result.structuredContent).success).toBe(true);
  });

  it("should resolve the output schema for a configured step", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await resolveStepTypeOutputSchemaTool.handler(
      {
        alias: "umbracoAutomate.logMessage",
        settings: { message: "Hello" },
      },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });

  // The API answers 200 with a null body for a step with no output. That must come
  // back as structured content, or the MCP client rejects the whole result.
  it("should report no output for a step that outputs no data", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await resolveStepTypeOutputSchemaTool.handler(
      {
        alias: "umbracoAutomate.if",
        settings: {},
      },
      context
    );

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ hasOutput: false });
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
