/**
 * Automations Tool Collection
 *
 * Tools for managing Umbraco Automate automations: their definitions
 * (trigger, steps, connections), lifecycle (publish/unpublish/re-enable),
 * manual triggering, run history, webhook URLs, workspace groups, and
 * import/export of portable definitions.
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";

// get
import listAutomationsTool from "./get/list-automations.js";
import getAutomationTool from "./get/get-automation.js";
import getAutomationAncestorsTool from "./get/get-automation-ancestors.js";
import exportAutomationTool from "./get/export-automation.js";
import listAutomationRunsTool from "./get/list-automation-runs.js";
import getAutomationWebhookUrlTool from "./get/get-automation-webhook-url.js";
import getAutomationGroupTool from "./get/get-automation-group.js";

// post
import createAutomationTool from "./post/create-automation.js";
import publishAutomationTool from "./post/publish-automation.js";
import unpublishAutomationTool from "./post/unpublish-automation.js";
import reEnableAutomationTool from "./post/re-enable-automation.js";
import triggerAutomationTool from "./post/trigger-automation.js";
import importAutomationTool from "./post/import-automation.js";
import validateAutomationImportTool from "./post/validate-automation-import.js";
import addAutomationStepTool from "./post/add-automation-step.js";
import connectAutomationStepsTool from "./post/connect-automation-steps.js";

// put
import updateAutomationTool from "./put/update-automation.js";
import importAutomationIntoExistingTool from "./put/import-automation-into-existing.js";
import updateAutomationStepTool from "./put/update-automation-step.js";
import setAutomationTriggerTool from "./put/set-automation-trigger.js";

// delete
import deleteAutomationTool from "./delete/delete-automation.js";
import removeAutomationStepTool from "./delete/remove-automation-step.js";
import disconnectAutomationStepsTool from "./delete/disconnect-automation-steps.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "automations",
    displayName: "Automations",
    description:
      "Manage Umbraco Automate automations: create/read/update/delete automation definitions, build out their trigger/step/connection graph one piece at a time, publish/unpublish/re-enable/trigger their lifecycle, inspect run history, look up webhook URLs and workspace groups, and import/export portable automation definitions.",
  },
  tools: () => [
    listAutomationsTool,
    getAutomationTool,
    getAutomationAncestorsTool,
    exportAutomationTool,
    listAutomationRunsTool,
    getAutomationWebhookUrlTool,
    getAutomationGroupTool,
    createAutomationTool,
    publishAutomationTool,
    unpublishAutomationTool,
    reEnableAutomationTool,
    triggerAutomationTool,
    importAutomationTool,
    validateAutomationImportTool,
    updateAutomationTool,
    importAutomationIntoExistingTool,
    deleteAutomationTool,
    addAutomationStepTool,
    updateAutomationStepTool,
    removeAutomationStepTool,
    connectAutomationStepsTool,
    disconnectAutomationStepsTool,
    setAutomationTriggerTool,
  ],
};

export default collection;
