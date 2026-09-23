import {
  setupTestEnvironment,
  ConnectionBuilder,
  ConnectionTestHelper,
} from "../setup.js";

const TEST_NAME = "_Test Helper Connection";
const TEST_ALIAS = "_test_helper_connection";
const OTHER_ALIAS = `${TEST_ALIAS}_other`;

describe("ConnectionTestHelper", () => {
  setupTestEnvironment();

  let builder: ConnectionBuilder | undefined;

  afterEach(async () => {
    // Always clean up created connections to prevent conflicts with other test files
    if (builder) await builder.delete();
    builder = undefined;
    await ConnectionTestHelper.cleanup(TEST_ALIAS);
  });

  it("should find a freshly created connection by alias", async () => {
    builder = await new ConnectionBuilder()
      .withAlias(TEST_ALIAS)
      .withName(TEST_NAME)
      .create();

    const found = await ConnectionTestHelper.findByAlias(TEST_ALIAS);

    expect(found).toBeDefined();
    expect(found?.id).toBe(builder.getId());
    expect(found?.name).toBe(TEST_NAME);
  });

  it("should return undefined for an alias that doesn't exist", async () => {
    const found = await ConnectionTestHelper.findByAlias("_test_helper_nonexistent_connection");

    expect(found).toBeUndefined();
  });

  it("should delete every connection whose alias starts with the prefix", async () => {
    await new ConnectionBuilder().withAlias(TEST_ALIAS).withName(TEST_NAME).create();
    await new ConnectionBuilder()
      .withAlias(OTHER_ALIAS)
      .withName(`${TEST_NAME} Other`)
      .create();

    await ConnectionTestHelper.cleanup(TEST_ALIAS);

    expect(await ConnectionTestHelper.findByAlias(TEST_ALIAS)).toBeUndefined();
    expect(await ConnectionTestHelper.findByAlias(OTHER_ALIAS)).toBeUndefined();
  });

  describe("normalizeIds", () => {
    it("should blank id, recursively", () => {
      const input = {
        id: "3781345e-515f-4001-b646-4dae16e3e8a6",
        alias: "realAlias",
        settings: {
          id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          baseUrl: "https://example.com",
        },
      };

      expect(ConnectionTestHelper.normalizeIds(input)).toEqual({
        id: "00000000-0000-0000-0000-000000000000",
        alias: "realAlias",
        settings: {
          id: "00000000-0000-0000-0000-000000000000",
          baseUrl: "https://example.com",
        },
      });
    });

    it("should leave objects without ids untouched", () => {
      const input = { alias: "realAlias", type: "http" };

      expect(ConnectionTestHelper.normalizeIds(input)).toEqual(input);
    });

    it("should leave non-object input untouched", () => {
      expect(ConnectionTestHelper.normalizeIds("plain")).toBe("plain");
      expect(ConnectionTestHelper.normalizeIds(null)).toBeNull();
    });
  });
});
