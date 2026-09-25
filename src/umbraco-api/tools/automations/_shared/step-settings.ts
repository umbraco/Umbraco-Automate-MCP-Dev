/**
 * Step Settings Normalization
 *
 * A step's `settings` is an untyped object the Management API stores verbatim.
 * The runtime reads condition-based settings case-insensitively, but the
 * backoffice editors (ConditionBuilder for If/While, SwitchCaseBuilder for
 * Switch) read PascalCase keys only - `{ Groups: [{ Conditions: [{ LeftOperand,
 * Operator, RightOperand }] }] }` and `[{ Name, Conditions }]`. Settings saved
 * in camelCase therefore run correctly but open as empty in the backoffice, and
 * re-saving them there drops the conditions.
 *
 * So condition sets and switch cases are rewritten to PascalCase keys before
 * saving. Only those two structures are touched, identified by shape (a
 * `groups` array of objects holding a `conditions` array, or a list of cases
 * that each hold such a set); everything else passes through unchanged, and
 * operand values are never altered.
 */

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getKey = (obj: JsonObject, key: string): unknown =>
  obj[key] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)];

const isConditionSet = (value: unknown): value is JsonObject => {
  if (!isObject(value)) return false;
  const groups = getKey(value, "groups");
  return (
    Array.isArray(groups) &&
    groups.every((group) => isObject(group) && Array.isArray(getKey(group, "conditions")))
  );
};

const isSwitchCaseList = (value: unknown): value is JsonObject[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => isObject(item) && isConditionSet(getKey(item, "conditions")));

/** Recursively upper-cases the first letter of every object key; values are left as-is. */
function pascalKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pascalKeys);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key.charAt(0).toUpperCase() + key.slice(1),
      pascalKeys(inner),
    ]),
  );
}

export function normalizeStepSettings(settings: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      isConditionSet(value) || isSwitchCaseList(value) ? pascalKeys(value) : value,
    ]),
  );
}

/**
 * Shared guidance for the `settings` input of the step tools, so the model knows
 * the condition format without guessing from other automations.
 */
export const CONDITION_SETTINGS_HELP =
  "Condition-based steps take a condition set: { groups: [{ conditions: [{ leftOperand, operator, rightOperand }] }] } - conditions within a group are ANDed, groups are ORed (there is no combinator field). If/While put it under `conditions`; Switch takes `cases`: [{ name, conditions: <condition set> }], evaluated in order, first match wins. Connect each Switch case with connect-automation-steps using outcome = the case name, plus outcome \"default\" for no match; an If connects with outcome \"true\"/\"false\", a While/ForEach/Parallel with \"body\"/\"done\". Operators: Equals, NotEquals, Contains, NotContains, StartsWith, EndsWith, GreaterThan, LessThan, GreaterThanOrEquals, LessThanOrEquals, IsEmpty, IsNotEmpty. Keys may be camelCase; they are saved in the PascalCase form the backoffice editor reads.";
