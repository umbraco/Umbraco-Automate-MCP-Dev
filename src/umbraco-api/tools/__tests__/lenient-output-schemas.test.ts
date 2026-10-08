import { McpServer, type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  useDraft202012ToolSchemas,
  type ToolCollectionExport,
  type ToolDefinition,
} from "@umbraco-cms/mcp-server-sdk";
import { collections } from "../../../collections.js";
import { withLenientOutputSchemas } from "../lenient-output-schemas.js";
import catalogueCollection from "../catalogue/index.js";
import automationsCollection from "../automations/index.js";

// The settings field shape Automate 17.4 / 18.4 return for a catalogue item.
const settingsField = {
  key: "to",
  label: "To",
  description: null,
  editorUiAlias: "Umb.PropertyEditorUi.TextBox",
  editorConfig: null,
  defaultValue: null,
  sortOrder: 0,
  isSensitive: false,
  isRequired: true,
  group: null,
  supportsBindings: true,
};

const catalogueItem = (field: Record<string, unknown>) => ({
  alias: "sendEmail",
  name: "Send Email",
  description: null,
  group: null,
  icon: null,
  connectionTypeAlias: null,
  settingsSchema: { fields: [field] },
  outputSchema: null,
  hasDynamicOutputSchema: false,
  type: "action",
});

// Automate 17.5 / 18.5 added a field-visibility condition to every settings field.
const visibleWhen = { key: "bodyMode", propertyName: "BodyMode", values: ["Html"] };

const toolsOf = (collection: ToolCollectionExport): ToolDefinition<any, any>[] =>
  collection.tools({});

const findTool = (collection: ToolCollectionExport, name: string) => {
  const tool = toolsOf(collection).find((t) => t.name === name);
  if (!tool) throw new Error(`No tool ${name} in ${collection.metadata.name}`);
  return tool;
};

/**
 * Registers a collection the way src/index.ts does, with every handler replaced by one
 * that returns `payload`, and connects an MCP client that validates structured content
 * against each tool's published output schema - as Claude Desktop does.
 */
async function connect(collection: ToolCollectionExport, payload: unknown = {}) {
  const server = new McpServer({ name: "lenient-output-schemas-test", version: "1.0.0" });
  for (const tool of toolsOf(collection)) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema, outputSchema: tool.outputSchema },
      (async () => ({
        content: [{ type: "text", text: JSON.stringify(payload) }],
        structuredContent: payload,
      })) as unknown as ToolCallback<any>,
    );
  }
  useDraft202012ToolSchemas(server);

  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "lenient-output-schemas-test-client", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  return { client, tools };
}

async function callWith(collection: ToolCollectionExport, toolName: string, payload: unknown) {
  const { client } = await connect(collection, payload);
  try {
    return await client.callTool({ name: toolName, arguments: {} });
  } finally {
    await client.close();
  }
}

/** The error a validating client sees, whether the server or the client refused the result. */
async function refusal(collection: ToolCollectionExport, toolName: string, payload: unknown) {
  try {
    const result = await callWith(collection, toolName, payload);
    return result.isError ? JSON.stringify(result.content) : "accepted";
  } catch (error) {
    return String(error);
  }
}

/** Every `additionalProperties: false` in a JSON Schema, by path. */
function closedObjectPaths(schema: unknown, path = "#"): string[] {
  if (!schema || typeof schema !== "object") return [];
  const node = schema as Record<string, unknown>;
  const own = node.additionalProperties === false ? [path] : [];
  return own.concat(
    Object.entries(node).flatMap(([key, value]) => closedObjectPaths(value, `${path}/${key}`)),
  );
}

describe("withLenientOutputSchemas", () => {
  const catalogue = withLenientOutputSchemas(catalogueCollection);

  it("should accept catalogue fields that newer Automate versions add", async () => {
    const payload = { items: [catalogueItem({ ...settingsField, visibleWhen })] };

    const result = await callWith(catalogue, "list-catalogue-actions", payload);

    expect(result.structuredContent).toEqual(payload);
  });

  it("should still accept catalogue responses from Automate versions without them", async () => {
    const payload = { items: [catalogueItem(settingsField)] };

    const result = await callWith(catalogue, "list-catalogue-actions", payload);

    expect(result.structuredContent).toEqual(payload);
  });

  it("should still accept triggers from Automate versions that predate supportsManualRun", async () => {
    const trigger = { alias: "contentPublished", name: "Content Published", type: "trigger" };
    const { supportsManualRun: _, ...olderTrigger } = {
      ...catalogueItem(settingsField),
      ...trigger,
      supportsManualRun: true,
    };
    const payload = { items: [olderTrigger] };

    const result = await callWith(catalogue, "list-catalogue-triggers", payload);

    expect(result.structuredContent).toEqual(payload);
  });

  it("should still reject a response missing a required field", async () => {
    const { alias: _, ...withoutAlias } = catalogueItem(settingsField);

    expect(await refusal(catalogue, "list-catalogue-actions", { items: [withoutAlias] })).toMatch(
      /alias/,
    );
  });

  it("should still reject a known field of the wrong type", async () => {
    const payload = { items: [catalogueItem({ ...settingsField, sortOrder: "first" })] };

    // Zod reports a failure inside a union (v18's nullable settingsSchema) at the union itself.
    expect(await refusal(catalogue, "list-catalogue-actions", payload)).toMatch(/settingsSchema/);
  });

  it("should leave input schemas untouched", () => {
    const original = toolsOf(catalogueCollection);
    const lenient = toolsOf(catalogue);

    lenient.forEach((tool, i) => expect(tool.inputSchema).toBe(original[i].inputSchema));
  });

  it("should keep output field descriptions", async () => {
    const { client, tools } = await connect(withLenientOutputSchemas(automationsCollection));
    await client.close();

    const webhookUrl = tools.find((t) => t.name === "get-automation-webhook-url");
    expect((webhookUrl?.outputSchema?.properties as any)?.note?.description).toBe(
      "Present when the URL was derived rather than reported by Umbraco.",
    );
  });

  it("should not change the tool definitions it wraps", () => {
    const tool = findTool(catalogueCollection, "list-catalogue-actions");
    const before = tool.outputSchema;

    findTool(catalogue, "list-catalogue-actions");

    expect(tool.outputSchema).toBe(before);
  });
});

describe("exported collections", () => {
  it.each(collections.map((c) => [c.metadata.name, c] as const))(
    "should publish %s output schemas that allow unknown properties",
    async (_, collection) => {
      const { client, tools } = await connect(collection);
      await client.close();

      for (const tool of tools.filter((t) => t.outputSchema)) {
        expect({ tool: tool.name, type: tool.outputSchema?.type }).toEqual({
          tool: tool.name,
          type: "object",
        });
        expect({ tool: tool.name, closed: closedObjectPaths(tool.outputSchema) }).toEqual({
          tool: tool.name,
          closed: [],
        });
      }
    },
  );
});
