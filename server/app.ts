import express from "express";
import { rateLimit } from "express-rate-limit";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";
import { config } from "./config";
import { repository } from "./database";
import { chat, generateDeck } from "./gemini";
import { renderPresentation } from "./presentation";
import {
  AppError,
  chatSchema,
  presentationSchema,
  profileSchema,
  resourceSchema,
} from "./validation";

type Repository = Pick<
  typeof repository,
  | "health"
  | "workspace"
  | "saveProfile"
  | "addResource"
  | "deleteResource"
  | "conversationId"
  | "appendTurn"
  | "resetConversation"
>;
type Dependencies = {
  repository: Repository;
  chat: typeof chat;
  generateDeck: typeof generateDeck;
};
export function createApp(
  deps: Dependencies = { repository, chat, generateDeck },
) {
  const app = express();
  const busy = new Set<string>();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Try again in a minute." },
    }),
  );
  app.use("/api", (req, _res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (
        req.headers["sec-fetch-site"] === "cross-site" ||
        (req.headers.origin && req.headers.origin !== config.origin)
      ) {
        return next(
          new AppError(403, "Request origin is not allowed. Check APP_ORIGIN."),
        );
      }
      if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || ""))
        return next(new AppError(415, "Send application/json."));
    }
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  const sign = (id: string) =>
    createHmac("sha256", config.sessionSecret).update(id).digest("hex");
  app.use("/api", (req, res, next) => {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("cognigraph_session="))
      ?.slice("cognigraph_session=".length);
    const [id, signature] = (cookie || "").split(".");
    const valid =
      /^[\da-f-]{36}$/.test(id || "") &&
      /^[\da-f]{64}$/.test(signature || "") &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(sign(id)));
    const userId = valid ? id : randomUUID();
    res.locals.userId = userId;
    if (!valid)
      res.cookie("cognigraph_session", `${userId}.${sign(userId)}`, {
        httpOnly: true,
        sameSite: "strict",
        secure: config.production,
        maxAge: 365 * 24 * 3600000,
        path: "/",
      });
    next();
  });
  app.get("/api/health", async (_req, res) => {
    const database = await deps.repository.health();
    res.json({
      database,
      gemini: !!config.geminiKey,
      aiConfigured:
        config.aiProvider === "openrouter"
          ? !!config.openrouterKey
          : !!config.geminiKey,
      provider: config.aiProvider,
      youtube: !!config.youtubeKey,
      model:
        config.aiProvider === "openrouter"
          ? config.openrouterModel
          : config.model,
      ...(!database
        ? {
            message:
              "Neo4j is unavailable. Set up .env and start the database; the catalog preview remains available.",
          }
        : {}),
    });
  });
  app.get("/api/workspace", async (_req, res) => {
    res.json(await deps.repository.workspace(res.locals.userId));
  });
  app.put("/api/profile", async (req, res) => {
    await deps.repository.saveProfile(
      res.locals.userId,
      profileSchema.parse(req.body),
    );
    res.json({ ok: true });
  });
  app.post("/api/resources", async (req, res) => {
    res
      .status(201)
      .json(
        await deps.repository.addResource(
          res.locals.userId,
          resourceSchema.parse(req.body),
        ),
      );
  });
  app.delete("/api/resources/:id", async (req, res) => {
    await deps.repository.deleteResource(
      res.locals.userId,
      req.params.id as string,
    );
    res.json({ ok: true });
  });
  const aiLimiter = rateLimit({
    windowMs: 60000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "AI request limit reached. Try again in a minute." },
  });
  app.post("/api/chat", aiLimiter, async (req, res) => {
    const input = chatSchema.parse(req.body);
    const userId = res.locals.userId as string;
    if (busy.has(userId))
      throw new AppError(
        409,
        "A reply is already being generated. Please wait.",
      );
    busy.add(userId);
    try {
      const conversationId = await deps.repository.conversationId(userId);
      const workspace = await deps.repository.workspace(userId);
      const reply = await deps.chat(
        workspace,
        input.message,
        input.includeVideos,
      );
      const messages = await deps.repository.appendTurn(
        userId,
        conversationId,
        input.message,
        reply,
      );
      res.json({ messages });
    } finally {
      busy.delete(userId);
    }
  });
  app.delete("/api/chat", async (_req, res) => {
    if (busy.has(res.locals.userId))
      throw new AppError(409, "Wait for the current reply before resetting.");
    await deps.repository.resetConversation(res.locals.userId);
    res.json({ ok: true });
  });
  app.post("/api/presentations", aiLimiter, async (req, res) => {
    const input = presentationSchema.parse(req.body);
    const userId = res.locals.userId as string;
    if (busy.has(userId))
      throw new AppError(409, "An AI request is already running. Please wait.");
    busy.add(userId);
    try {
      const workspace = await deps.repository.workspace(userId);
      const { deck, resources } = await deps.generateDeck(
        workspace,
        input.topic,
        input.slideCount,
      );
      const buffer = await renderPresentation(deck, resources);
      const filename =
        deck.title.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) ||
        "cognigraph-study";
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.pptx"`,
      );
      res.send(buffer);
    } finally {
      busy.delete(userId);
    }
  });
  app.use("/api", (_req, _res, next) =>
    next(new AppError(404, "API endpoint not found.")),
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        });
        return;
      }
      if (error instanceof AppError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      const status = (error as { status?: number })?.status;
      if (status === 413 || status === 400) {
        res.status(status).json({
          error:
            status === 413 ? "Request is too large." : "Invalid JSON request.",
        });
        return;
      }
      // Do not expose driver errors, provider messages, credentials, or note contents.
      res.status(503).json({
        error:
          "The knowledge database is unavailable. Check Neo4j configuration and try again.",
      });
    },
  );
  return app;
}
