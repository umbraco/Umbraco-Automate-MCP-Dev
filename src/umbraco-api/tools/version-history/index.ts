/**
 * Version History Tool Collection
 *
 * A generic versioning/audit-trail feature over entities such as
 * automations: list an entity's recorded versions, inspect a single past
 * version, diff two versions, and roll back to a prior version.
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import getVersionHistorySupportedTypesTool from "./get/list-version-history-supported-types.js";
import listVersionHistoryTool from "./get/list-version-history.js";
import getVersionHistoryEntryTool from "./get/get-version-history-entry.js";
import compareVersionHistoryTool from "./get/compare-version-history.js";
import rollbackVersionHistoryTool from "./post/rollback-version-history.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "version-history",
    displayName: "Version History",
    description:
      "View, compare, and roll back past versions of versioned entities (e.g. automations).",
  },
  tools: () => [
    getVersionHistorySupportedTypesTool,
    listVersionHistoryTool,
    getVersionHistoryEntryTool,
    compareVersionHistoryTool,
    rollbackVersionHistoryTool,
  ],
};

export default collection;
