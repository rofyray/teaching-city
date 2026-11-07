import "server-only";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output, type LanguageModel } from "ai";
import { and, count, eq, gte } from "drizzle-orm";
import type * as z from "zod";
import { localDate, zonedTime } from "@/domain/time";
import { db } from "../db";
import { aiEvents, type AiFeature } from "../db/schema";

export const AI_DAILY_LIMIT = 20;
export const AI_TIMEOUT_MS = 15_000;

export type AiErrorCode = "unavailable" | "limit" | "invalid";

export class AiError extends Error {
  constructor(public code: AiErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AiError";
  }
}

export function aiConfigured(): boolean {
  if (process.env.AI_MOCK === "true") return true;
  return !!process.env.AI_MODEL && !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL);
}

async function resolveModel(feature: AiFeature): Promise<{ model: LanguageModel; id: string }> {
  if (process.env.AI_MOCK === "true") {
    const { mockModel } = await import("./mock");
    return { model: mockModel(feature), id: "mock" };
  }
  const id = process.env.AI_MODEL;
  if (!id || !aiConfigured()) throw new AiError("unavailable");
  return { model: gateway(id), id };
}

/** BR-14: 20 requests per user per day per feature, counted in the program time zone. */
export async function usedToday(userId: string, feature: AiFeature, now = new Date(), timeZone = "America/Chicago") {
  const startOfDay = zonedTime(localDate(now, timeZone), "00:00", timeZone);
  const [row] = await db
    .select({ n: count() })
    .from(aiEvents)
    .where(and(eq(aiEvents.userId, userId), eq(aiEvents.feature, feature), gte(aiEvents.createdAt, startOfDay)));
  return row.n;
}

/**
 * Runs one structured AI request. Every call writes an ai_events row (feature, model, token
 * counts, never the text). Output is a draft until a person accepts it.
 */
export async function runAi<T>({
  userId,
  feature,
  instructions,
  prompt,
  schema,
}: {
  userId: string;
  feature: AiFeature;
  instructions: string;
  prompt: string;
  schema: z.ZodType<T>;
}): Promise<{ eventId: string; output: T }> {
  if ((await usedToday(userId, feature)) >= AI_DAILY_LIMIT) throw new AiError("limit");
  const { model, id } = await resolveModel(feature);
  let result;
  try {
    result = await generateText({
      model,
      instructions,
      prompt,
      output: Output.object({ schema }),
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      maxRetries: 1,
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "ai_error", feature, message: error instanceof Error ? error.message : String(error) }));
    await db.insert(aiEvents).values({ userId, feature, model: id, inputTokens: null, outputTokens: null, accepted: null });
    throw new AiError("unavailable");
  }
  const [event] = await db
    .insert(aiEvents)
    .values({
      userId,
      feature,
      model: id,
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
    })
    .returning({ id: aiEvents.id });
  return { eventId: event.id, output: result.output as T };
}

export async function markAiAccepted(userId: string, eventId: string, accepted: boolean) {
  await db.update(aiEvents).set({ accepted }).where(and(eq(aiEvents.id, eventId), eq(aiEvents.userId, userId)));
}
