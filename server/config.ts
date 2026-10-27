import "dotenv/config";
import { randomBytes } from "node:crypto";

const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
) {
  throw new Error(
    "Set SESSION_SECRET to at least 32 characters in production.",
  );
}
export const config = {
  production,
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "127.0.0.1",
  origin: process.env.APP_ORIGIN || (production ? "" : "http://localhost:5173"),
  sessionSecret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  aiProvider:
    process.env.AI_PROVIDER ||
    (process.env.OPENROUTER_API_KEY ? "openrouter" : "gemini"),
  openrouterKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/free",
  geminiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  fallbackModel: process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash",
  youtubeKey: process.env.YOUTUBE_API_KEY || "",
  neo4jUri: process.env.NEO4J_URI || "",
  neo4jUser: process.env.NEO4J_USERNAME || "neo4j",
  neo4jPassword: process.env.NEO4J_PASSWORD || "",
  neo4jDatabase: process.env.NEO4J_DATABASE || "neo4j",
};
if (production && !config.origin)
  throw new Error("APP_ORIGIN is required in production.");
