export class VersionHistoryTestHelper {
  /**
   * createSnapshotResult only zeroes a fixed top-level `id`, but a version-history response
   * nests a fresh random `id` and `entityId` per version-entry (plus a live `dateCreated`
   * timestamp) - none of which createSnapshotResult's normalizer name-list covers. Run
   * responses through this before snapshotting so repeated runs are stable.
   */
  static normalize(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalize(item));
    }
    if (data && typeof data === "object") {
      const normalized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
      for (const idField of ["id", "entityId", "createdByUserId"]) {
        if (normalized[idField]) {
          normalized[idField] = "00000000-0000-0000-0000-000000000000";
        }
      }
      if (normalized.dateCreated) {
        normalized.dateCreated = "NORMALIZED_DATE";
      }
      for (const key of Object.keys(normalized)) {
        normalized[key] = this.normalize(normalized[key]);
      }
      return normalized;
    }
    return data;
  }
}
