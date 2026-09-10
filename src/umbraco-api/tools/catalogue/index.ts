/**
 * Catalogue Tool Collection
 *
 * Read-only reference lookups for what is available when building
 * automations: actions, connection types, control-flow constructs,
 * notification channels, step types, triggers, and webhook authenticators.
 * Aliases returned by these tools are used to configure steps in the
 * automations collection.
 */

import { ToolCollectionExport } from "@umbraco-cms/mcp-server-sdk";
import listActionsTool from "./get/list-actions.js";
import listConnectionTypesTool from "./get/list-connection-types.js";
import listControlFlowsTool from "./get/list-control-flows.js";
import listNotificationChannelsTool from "./get/list-notification-channels.js";
import listStepTypesTool from "./get/list-step-types.js";
import listTriggersTool from "./get/list-triggers.js";
import listWebhookAuthenticatorsTool from "./get/list-webhook-authenticators.js";
import resolveStepTypeOutputSchemaTool from "./post/resolve-step-type-output-schema.js";

const collection: ToolCollectionExport = {
  metadata: {
    name: "catalogue",
    displayName: "Catalogue",
    description:
      "Reference catalogue of everything available for building automations: actions, connection types, control-flow constructs, notification channels, step types, triggers, and webhook authenticators.",
  },
  tools: () => [
    listActionsTool,
    listConnectionTypesTool,
    listControlFlowsTool,
    listNotificationChannelsTool,
    listStepTypesTool,
    listTriggersTool,
    listWebhookAuthenticatorsTool,
    resolveStepTypeOutputSchemaTool,
  ],
};

export default collection;
