import { normalizeStepSettings } from "../_shared/step-settings.js";

const camelConditionSet = {
  groups: [
    {
      conditions: [{ leftOperand: "${trigger.fields.interest}", operator: "Contains", rightOperand: "Enterprise" }],
    },
  ],
};

const pascalConditionSet = {
  Groups: [
    {
      Conditions: [{ LeftOperand: "${trigger.fields.interest}", Operator: "Contains", RightOperand: "Enterprise" }],
    },
  ],
};

describe("normalizeStepSettings", () => {
  it("should rewrite an If/While condition set to the backoffice's PascalCase keys", () => {
    expect(normalizeStepSettings({ conditions: camelConditionSet, maxIterations: 3 })).toEqual({
      conditions: pascalConditionSet,
      maxIterations: 3,
    });
  });

  it("should rewrite Switch cases, including each case's condition set", () => {
    expect(normalizeStepSettings({ cases: [{ name: "enterprise", conditions: camelConditionSet }] })).toEqual({
      cases: [{ Name: "enterprise", Conditions: pascalConditionSet }],
    });
  });

  it("should leave settings already in PascalCase unchanged", () => {
    const settings = { cases: [{ Name: "enterprise", Conditions: pascalConditionSet }] };
    expect(normalizeStepSettings(settings)).toEqual(settings);
  });

  it("should leave unrelated settings untouched, even ones with similar key names", () => {
    const settings = {
      message: "hi",
      groups: ["editors", "writers"],
      conditions: "not a condition set",
      recipients: [{ name: "Sales", email: "sales@example.com" }],
    };
    expect(normalizeStepSettings(settings)).toEqual(settings);
  });
});
