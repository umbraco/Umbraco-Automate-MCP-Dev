/**
 * Lenient Output Schemas
 *
 * The MCP SDK publishes each output schema as JSON Schema with every plain
 * `z.object` closed (`additionalProperties: false`), and clients that validate
 * structured content (Claude Desktop, MCP Inspector) refuse a result carrying a
 * key the schema doesn't list. Umbraco passes its responses through unchanged,
 * so a field added in a later Automate minor (e.g. 17.5's `visibleWhen` on
 * settings fields) would break every tool returning it on an MCP built against
 * an earlier spec.
 *
 * This opens every object in a tool's output schema to unknown keys and leaves
 * everything else as it was: known fields keep their types and required/optional
 * state, so responses from older Automate releases validate exactly as before,
 * and input schemas stay strict.
 */

import type { ToolCollectionExport, ToolDefinition } from "@umbraco-cms/mcp-server-sdk";
import { z } from "zod";

type AnySchema = z.core.$ZodType;
type Def = Record<string, any>;

const lenient = new WeakMap<AnySchema, AnySchema>();

/** Child schemas held in a def, by the def key that holds them. */
const SINGLE_CHILD_KEYS = ["element", "innerType", "keyType", "valueType", "left", "right", "in", "out"];
const LIST_CHILD_KEYS = ["options", "items"];

function rebuild(schema: AnySchema): AnySchema {
  const def = schema._zod.def as Def;
  const next: Def = { ...def };

  if (def.type === "object") {
    next.shape = Object.fromEntries(
      Object.entries(def.shape as Record<string, AnySchema>).map(([key, value]) => [key, loosen(value)]),
    );
    next.catchall = def.catchall ? loosen(def.catchall) : z.unknown();
  } else if (def.type === "lazy") {
    const getter = def.getter as () => AnySchema;
    next.getter = () => loosen(getter());
  }
  for (const key of SINGLE_CHILD_KEYS) {
    if (def[key]) next[key] = loosen(def[key]);
  }
  for (const key of LIST_CHILD_KEYS) {
    if (Array.isArray(def[key])) next[key] = def[key].map(loosen);
  }
  if (def.type === "tuple" && def.rest) next.rest = loosen(def.rest);

  // `parent` keeps the original's registry metadata (descriptions) on the copy.
  return z.core.clone(schema, next as any, { parent: true });
}

/** Returns `schema` with every object in it open to unknown keys. */
export function loosen<T extends AnySchema>(schema: T): T {
  let result = lenient.get(schema);
  if (!result) {
    result = rebuild(schema);
    lenient.set(schema, result);
  }
  return result as T;
}

function withLenientOutputSchema(tool: ToolDefinition<any, any>): ToolDefinition<any, any> {
  if (!tool.outputSchema) return tool;
  // Tools may give a raw shape, which the SDK would wrap in a closed z.object.
  const outputSchema =
    tool.outputSchema instanceof z.ZodType
      ? loosen(tool.outputSchema)
      : loosen(z.object(tool.outputSchema));
  return { ...tool, outputSchema };
}

/** Wraps a collection so each of its tools publishes a lenient output schema. */
export function withLenientOutputSchemas(collection: ToolCollectionExport): ToolCollectionExport {
  return {
    ...collection,
    tools: (user) => collection.tools(user).map(withLenientOutputSchema),
  };
}
