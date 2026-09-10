import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  ConnectionBuilder,
  ConnectionTestHelper,
} from "./setup.js";
import { encodeCursor } from "@umbraco-cms/mcp-server-sdk";
import {
  validateToolResponse,
  type CursorPaginatedResult,
} from "@umbraco-cms/mcp-server-sdk/testing";
import listConnectionsTool from "../get/list-connections.js";

const TEST_ALIAS_PREFIX = "_test_list_connection";

describe("list-connections", () => {
  setupTestEnvironment();

  let builderA: ConnectionBuilder;
  let builderB: ConnectionBuilder;

  beforeEach(async () => {
    builderA = await new ConnectionBuilder()
      .withAlias(`${TEST_ALIAS_PREFIX}_a`)
      .withName("_Test List Connection A")
      .create();
    builderB = await new ConnectionBuilder()
      .withAlias(`${TEST_ALIAS_PREFIX}_b`)
      .withName("_Test List Connection B")
      .create();
  });

  afterEach(async () => {
    if (builderA) await builderA.delete();
    if (builderB) await builderB.delete();
    await ConnectionTestHelper.cleanup(TEST_ALIAS_PREFIX);
  });

  it("should list connections matching a filter", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listConnectionsTool.handler(
      { filter: TEST_ALIAS_PREFIX },
      context,
    );

    const data = validateToolResponse(
      listConnectionsTool,
      result,
    ) as CursorPaginatedResult;
    expect(data.total).toBeGreaterThanOrEqual(2);
    expect(data.items.length).toBeGreaterThanOrEqual(2);
  });

  it("should paginate with cursor to a second page", async () => {
    const context = createMockRequestHandlerExtra();

    const page1 = await listConnectionsTool.handler(
      { filter: TEST_ALIAS_PREFIX, cursor: encodeCursor({ s: 0, t: 1 }) },
      context,
    );
    const data1 = validateToolResponse(
      listConnectionsTool,
      page1,
    ) as CursorPaginatedResult;
    expect(data1.nextCursor).toBeDefined();

    const page2 = await listConnectionsTool.handler(
      { filter: TEST_ALIAS_PREFIX, cursor: data1.nextCursor },
      context,
    );
    const data2 = validateToolResponse(
      listConnectionsTool,
      page2,
    ) as CursorPaginatedResult;
    expect(data2.items[0]).not.toEqual(data1.items[0]);
  });
});
