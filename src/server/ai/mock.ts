import { MockLanguageModelV4 } from "ai/test";
import type { AiFeature } from "../db/schema";

/** Deterministic model for tests and offline demos (AI_MOCK=true). */
const OUTPUTS: Record<AiFeature, unknown> = {
  note_draft: {
    note: "Your reconciliation was accurate and on time. Next week, share one finding in the team check-in.",
    evidence: [
      { competencyPosition: 1, sentence: "Reconciled the weekly overtime report with no corrections needed." },
      { competencyPosition: 2, sentence: null },
      { competencyPosition: 3, sentence: "Delivered the reconciliation a day before it was due." },
      { competencyPosition: 4, sentence: "Paired with a colleague to walk through the Parks numbers." },
      { competencyPosition: 5, sentence: null },
    ],
  },
  plain_language: {
    summary: "You help city departments keep track of money. You check numbers, write short reports and answer questions from staff and residents.",
    dayToDay: ["Check spending and revenue numbers", "Write reports that explain changes", "Answer questions about the budget"],
    whatYouNeed: [
      "Knowledge of accounting, spreadsheets and city budgets",
      "A bachelor's degree in a related field, or equivalent experience from a Teaching City rotation",
    ],
  },
  course_mapping: {
    matches: [{ classificationCode: "BA1", reason: "Cost Accounting builds skill in analyzing financial data accurately.", courses: ["Cost Accounting"] }],
  },
};

export function mockModel(feature: AiFeature) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(OUTPUTS[feature]) }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 120, noCache: 120, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 60, text: 60, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}
