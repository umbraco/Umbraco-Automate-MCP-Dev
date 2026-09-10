/**
 * Connections Tool Collection
 *
 * Tools for managing connections — configured credentials/endpoints to
 * third-party services that automation steps reference (e.g. an email
 * provider, a REST API, a Slack workspace).
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import listConnectionsTool from "./get/list-connections.js";
import getConnectionTool from "./get/get-connection.js";
import createConnectionTool from "./post/create-connection.js";
import testConnectionTool from "./post/test-connection.js";
import updateConnectionTool from "./put/update-connection.js";
import deleteConnectionTool from "./delete/delete-connection.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "connections",
    displayName: "Connections",
    description:
      "Manage connections — configured credentials/endpoints to third-party services that automation steps can reference by alias",
  },
  tools: () => [
    listConnectionsTool,
    getConnectionTool,
    createConnectionTool,
    testConnectionTool,
    updateConnectionTool,
    deleteConnectionTool,
  ],
};

export default collection;
