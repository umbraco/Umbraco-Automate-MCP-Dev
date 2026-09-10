import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
} from "./setup.js";
import listCatalogueNotificationChannelsTool from "../get/list-notification-channels.js";

describe("list-catalogue-notification-channels", () => {
  setupTestEnvironment();

  it("should list available notification channel definitions", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listCatalogueNotificationChannelsTool.handler(
      undefined as never,
      context
    );

    expect(result.isError).toBeFalsy();
    expect(createSnapshotResult(result)).toMatchSnapshot();
  });
});
