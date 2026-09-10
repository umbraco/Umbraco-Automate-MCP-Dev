import { encodeCursor } from "@umbraco-cms/mcp-server-sdk";
import { validateToolResponse, type CursorPaginatedResult } from "@umbraco-cms/mcp-server-sdk/testing";
import {
  setupTestEnvironment,
  createMockRequestHandlerExtra,
  RunFixture,
} from "./setup.js";
import listRunsTool from "../get/list-runs.js";

describe("list-runs", () => {
  setupTestEnvironment();

  let fixture: RunFixture;

  beforeAll(async () => {
    // list-runs has no automationId/workspaceId filter - it lists across every automation on
    // the instance. Trigger twice so at least 2 real run rows exist for the cursor-pagination
    // test below, regardless of what else is or isn't currently on the instance.
    fixture = await new RunFixture().setup();
    await fixture.triggerRun();
    await fixture.triggerRun();
  }, 30000);

  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });

  it("should list run instances across all automations", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listRunsTool.handler({}, context);

    const data = validateToolResponse(listRunsTool, result) as CursorPaginatedResult;
    expect(data.items.length).toBeGreaterThan(0);
  });

  it("should paginate with cursor to a second page", async () => {
    const context = createMockRequestHandlerExtra();

    const page1 = await listRunsTool.handler(
      { cursor: encodeCursor({ s: 0, t: 1 }) },
      context,
    );
    const data1 = validateToolResponse(listRunsTool, page1) as CursorPaginatedResult;
    expect(data1.nextCursor).toBeDefined();

    const page2 = await listRunsTool.handler({ cursor: data1.nextCursor }, context);
    const data2 = validateToolResponse(listRunsTool, page2) as CursorPaginatedResult;
    expect(data2.items[0]).not.toEqual(data1.items[0]);
  });
});
