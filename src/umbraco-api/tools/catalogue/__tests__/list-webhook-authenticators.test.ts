import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueWebhookAuthenticatorsTool from "../get/list-webhook-authenticators.js";

describe("list-catalogue-webhook-authenticators", () => {
  setupTestEnvironment();

  it("should list available webhook authenticator definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueWebhookAuthenticatorsTool.handler(
      undefined as never,
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
