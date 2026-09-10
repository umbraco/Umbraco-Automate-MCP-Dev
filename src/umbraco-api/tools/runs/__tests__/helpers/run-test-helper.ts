export class RunTestHelper {
  /**
   * createSnapshotResult (from the SDK testing helpers) only zeroes a single top-level `id`
   * and normalizes a fixed list of date field names that don't match this collection's own
   * (startedUtc/completedUtc), and it doesn't reach into the nested stepRuns array at all. Run
   * results through this afterward to strip all of those - plus the timing-dependent
   * durationMs - before snapshotting, so runs are stable across executions.
   */
  static normalizeIds(data: unknown): unknown {
    if (typeof data === "string") {
      // Error messages can embed a raw run/automation id inline - strip those too.
      return data.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "00000000-0000-0000-0000-000000000000",
      );
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeIds(item));
    }
    if (data && typeof data === "object") {
      const normalized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
      for (const idField of ["id", "automationId", "stepId", "correlationId"]) {
        if (normalized[idField]) {
          normalized[idField] = "00000000-0000-0000-0000-000000000000";
        }
      }
      for (const dateField of ["startedUtc", "completedUtc"]) {
        if (normalized[dateField]) {
          normalized[dateField] = "NORMALIZED_DATE";
        }
      }
      if (typeof normalized.durationMs === "number") {
        normalized.durationMs = 0;
      }
      for (const key of Object.keys(normalized)) {
        normalized[key] = this.normalizeIds(normalized[key]);
      }
      return normalized;
    }
    return data;
  }
}
