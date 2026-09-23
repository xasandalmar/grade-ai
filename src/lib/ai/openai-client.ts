import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

/** Server-only OpenAI client. Returns null if no key is configured, so callers
 * can skip AI features gracefully instead of crashing the upload/report flow. */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
