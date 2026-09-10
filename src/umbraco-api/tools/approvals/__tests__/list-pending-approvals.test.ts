import { setupTestEnvironment, createMockRequestHandlerExtra } from "./setup.js";
import listPendingApprovalsTool from "../get/list-pending-approvals.js";

describe("list-pending-approvals", () => {
  setupTestEnvironment();

  it("should list workflow run steps currently waiting for a human decision", async () => {
    const context = createMockRequestHandlerExtra();

    const result = await listPendingApprovalsTool.handler(undefined as never, context);

    expect(result.isError).toBeFalsy();
    // No tool in this collection can create test data on its own - a pending approval only
    // exists as a side effect of a real automation run pausing on an approval step (see
    // decide-approval-step.test.ts). Whether this instance currently has zero or several
    // paused runs is real state, not a bug, so this asserts on the response shape rather
    // than snapshotting specific (non-deterministic, possibly-empty) contents.
    const structured = result.structuredContent as {
      items: Array<{ runId: string; stepId: string; automationId: string }>;
    };
    expect(Array.isArray(structured.items)).toBe(true);
    for (const item of structured.items) {
      expect(item.runId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(item.stepId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });
});
