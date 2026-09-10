import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  createSnapshotResult,
  ConnectionBuilder,
} from "./setup.js";
import deleteConnectionTool from "../delete/delete-connection.js";
import getConnectionTool from "../get/get-connection.js";

const TEST_ALIAS = "_test_delete_connection";

describe("delete-connection", () => {
  setupTestEnvironment();

  it("should delete a connection", async () => {
    const context = createMockRequestHandlerExtra();
    const builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Delete Connection")
      .create();
    const id = builder.getId();

    const result = await deleteConnectionTool.handler({ id }, context);

    expect(createSnapshotResult(result, id)).toMatchSnapshot();

    const verify = await getConnectionTool.handler({ id }, context);
    expect(verify.isError).toBe(true);
  });

  it("should return an error deleting an already-deleted connection", async () => {
    const context = createMockRequestHandlerExtra();
    const builder = await new ConnectionBuilder()
      .withAlias(`${TEST_ALIAS}_twice`)
      .withName("_Test Delete Connection Twice")
      .create();
    const id = builder.getId();

    await deleteConnectionTool.handler({ id }, context);
    const result = await deleteConnectionTool.handler({ id }, context);

    expect(result.isError).toBe(true);
  });
});
