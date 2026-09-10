import {
  setupTestEnvironment,
  ConnectionBuilder,
  ConnectionTestHelper,
} from "../setup.js";

const TEST_ALIAS = "_test_builder_connection";

describe("ConnectionBuilder", () => {
  setupTestEnvironment();

  let builder: ConnectionBuilder;

  afterEach(async () => {
    // Always clean up created connections to prevent conflicts with other test files
    if (builder) await builder.delete();
    await ConnectionTestHelper.cleanup(TEST_ALIAS);
  });

  it("should create connection with builder", async () => {
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName("_Test Builder Connection")
      .create();

    expect(builder.getId()).toBeDefined();

    const found = await ConnectionTestHelper.findByAlias(TEST_ALIAS);
    expect(found).toBeDefined();
    expect(found?.alias).toBe(TEST_ALIAS);
  });
});
