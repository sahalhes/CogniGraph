import { test } from "node:test";
import assert from "node:assert/strict";
import { chat, generateDeck } from "../server/gemini";
import { config } from "../server/config";
import { courses, concepts, resources } from "../src/data/sampleKnowledgeBase";
import type { Workspace } from "../src/domain/workspace";
import { AppError } from "../server/validation";
const workspace: Workspace = {
  courses,
  concepts,
  resources,
  profile: {
    level: "intermediate",
    goal: "Learn Java",
    knownConceptIds: ["ds-core"],
  },
  messages: [
    {
      id: "1",
      role: "user",
      text: "I am revising Java",
      resources: [],
      videos: [],
      createdAt: "",
    },
    {
      id: "2",
      role: "assistant",
      text: "Let us study inheritance",
      resources: [],
      videos: [],
      createdAt: "",
    },
  ],
};
test("Gemini receives history and graph context; invented references are discarded and YouTube uses real results", async (t) => {
  const originalFetch = globalThis.fetch;
  const oldKey = config.geminiKey;
  const oldYoutube = config.youtubeKey;
  config.geminiKey = "test-only";
  config.youtubeKey = "test-youtube";
  let payload: Record<string, unknown> = {};
  globalThis.fetch = (async (
    url: string | URL | Request,
    options?: RequestInit,
  ) => {
    if (String(url).includes("youtube/v3/search"))
      return Response.json({
        items: [
          {
            id: { videoId: "abcdefghijk" },
            snippet: {
              title: "Java inheritance tutorial",
              channelTitle: "Teaching channel",
            },
          },
          { id: { videoId: "javascript:bad" } },
        ],
      });
    payload = JSON.parse(String(options?.body));
    return Response.json({
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                text: JSON.stringify({
                  text: "Inheritance explained.",
                  resourceIds: ["oop-textbook", "invented"],
                  youtubeQuery: "Java inheritance intermediate tutorial",
                }),
              },
            ],
          },
          finishReason: "STOP",
        },
      ],
    });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    config.geminiKey = oldKey;
    config.youtubeKey = oldYoutube;
  });
  const reply = await chat(workspace, "Explain Java inheritance", true);
  assert.equal(reply.text, "Inheritance explained.");
  assert.deepEqual(
    reply.resources.map((r) => r.id),
    ["oop-textbook"],
  );
  assert.equal(reply.videos.length, 1);
  assert.equal(
    reply.videos[0].url,
    "https://www.youtube.com/watch?v=abcdefghijk",
  );
  const serialized = JSON.stringify(payload);
  assert.ok(serialized.includes("I am revising Java"));
  assert.ok(serialized.includes("knownConceptIds"));
  assert.ok(serialized.includes("alreadyKnown"));
  assert.ok(serialized.includes("application/json"));
});
test("missing Gemini key is explicit and never falls back to a canned answer", async (t) => {
  const previous = config.geminiKey;
  config.geminiKey = "";
  t.after(() => {
    config.geminiKey = previous;
  });
  await assert.rejects(
    chat(workspace, "Java", false),
    (error: unknown) => error instanceof AppError && error.status === 503,
  );
});
test("presentation generator validates exact slide count before returning content", async (t) => {
  const originalFetch = globalThis.fetch;
  const previous = config.geminiKey;
  config.geminiKey = "test-only";
  globalThis.fetch = (async () =>
    Response.json({
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                text: JSON.stringify({
                  title: "Java",
                  slides: Array.from({ length: 4 }, () => ({
                    title: "Inheritance",
                    bullets: ["Example"],
                    notes: "Explanation",
                    resourceIds: [],
                  })),
                }),
              },
            ],
          },
        },
      ],
    })) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    config.geminiKey = previous;
  });
  const result = await generateDeck(workspace, "Java", 4);
  assert.equal(result.deck.slides.length, 4);
  await assert.rejects(
    generateDeck(workspace, "Java", 5),
    (error: unknown) => error instanceof AppError && error.status === 502,
  );
});

for (const failure of ["json", "length", "truncated", "empty"] as const) {
  test(`presentation recovers from ${failure} output and renders a PPTX`, async (t) => {
    const originalFetch = globalThis.fetch;
    const previous = config.geminiKey;
    config.geminiKey = "test-only";
    t.after(() => {
      globalThis.fetch = originalFetch;
      config.geminiKey = previous;
    });
    const deck = {
      title: "Java",
      slides: Array.from({ length: 4 }, () => ({
        title: "Inheritance",
        bullets: ["Example"],
        notes: "Explanation",
        resourceIds: [],
      })),
    };
    const requests: any[] = [];
    globalThis.fetch = (async (_url: unknown, options?: RequestInit) => {
      requests.push(JSON.parse(String(options?.body)));
      const first = requests.length === 1;
      let text = JSON.stringify(deck);
      if (first && failure === "json") text = '{"title":';
      if (first && failure === "length")
        text = JSON.stringify({ ...deck, slides: deck.slides.slice(0, 3) });
      if (first && failure === "empty") text = "";
      return Response.json({
        candidates: [
          {
            content: { role: "model", parts: [{ text }] },
            finishReason:
              first && failure === "truncated" ? "MAX_TOKENS" : "STOP",
          },
        ],
      });
    }) as typeof fetch;
    const result = await generateDeck(workspace, "Java", 4);
    assert.equal(result.deck.slides.length, 4);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].generationConfig.maxOutputTokens, 32768);
    assert.match(JSON.stringify(requests[1]), /Keep the response concise/);
    const { renderPresentation } = await import("../server/presentation");
    const pptx = await renderPresentation(result.deck, result.resources);
    assert.equal(pptx.subarray(0, 2).toString(), "PK");
  });
}

test("overloaded primary model falls back once and produces a valid deck", async (t) => {
  const originalFetch = globalThis.fetch;
  const previous = {
    key: config.geminiKey,
    model: config.model,
    fallback: config.fallbackModel,
  };
  config.geminiKey = "test-only";
  config.model = "overloaded-model";
  config.fallbackModel = "available-model";
  t.after(() => {
    globalThis.fetch = originalFetch;
    config.geminiKey = previous.key;
    config.model = previous.model;
    config.fallbackModel = previous.fallback;
  });
  const urls: string[] = [];
  globalThis.fetch = (async (url: unknown) => {
    urls.push(String(url));
    if (String(url).includes("overloaded-model"))
      return Response.json(
        { error: { code: 503, message: "High demand", status: "UNAVAILABLE" } },
        { status: 503 },
      );
    return Response.json({
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                text: JSON.stringify({
                  title: "Java",
                  slides: Array.from({ length: 4 }, () => ({
                    title: "Inheritance",
                    bullets: ["Example"],
                    notes: "Explanation",
                    resourceIds: [],
                  })),
                }),
              },
            ],
          },
          finishReason: "STOP",
        },
      ],
    });
  }) as typeof fetch;
  assert.equal(
    (await generateDeck(workspace, "Java", 4)).deck.slides.length,
    4,
  );
  assert.equal(urls.length, 2);
  assert.match(urls[1], /available-model/);
  globalThis.fetch = (async () =>
    Response.json(
      { error: { code: 503, message: "High demand", status: "UNAVAILABLE" } },
      { status: 503 },
    )) as typeof fetch;
  await assert.rejects(
    generateDeck(workspace, "Java", 4),
    (e: unknown) =>
      e instanceof AppError && e.status === 503 && /overloaded/.test(e.message),
  );
});

test("OpenRouter free model generates validated PPT content with server-side authentication and repairs malformed output", async (t) => {
  const originalFetch = globalThis.fetch;
  const previous = {
    provider: config.aiProvider,
    key: config.openrouterKey,
    model: config.openrouterModel,
    gemini: config.geminiKey,
  };
  config.aiProvider = "openrouter";
  config.openrouterKey = "test-openrouter-secret";
  config.openrouterModel = "openrouter/free";
  config.geminiKey = "";
  t.after(() => {
    globalThis.fetch = originalFetch;
    config.aiProvider = previous.provider;
    config.openrouterKey = previous.key;
    config.openrouterModel = previous.model;
    config.geminiKey = previous.gemini;
  });
  let calls = 0;
  globalThis.fetch = (async (url: unknown, options?: RequestInit) => {
    assert.equal(String(url), "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(
      (options?.headers as Record<string, string> | undefined)?.Authorization,
      "Bearer test-openrouter-secret",
    );
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "openrouter/free");
    assert.equal(body.response_format.type, "json_object");
    assert.ok(JSON.stringify(body.messages).includes("knownConceptIds"));
    calls++;
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content:
              calls === 1
                ? '{"title":'
                : JSON.stringify({
                    title: "Java",
                    slides: Array.from({ length: 4 }, () => ({
                      title: "Inheritance",
                      bullets: ["Example"],
                      notes: "Explanation",
                      resourceIds: [],
                    })),
                  }),
          },
        },
      ],
    });
  }) as typeof fetch;
  const result = await generateDeck(workspace, "Java", 4);
  assert.equal(calls, 2);
  assert.equal(result.deck.slides.length, 4);
  const { renderPresentation } = await import("../server/presentation");
  assert.equal(
    (await renderPresentation(result.deck, result.resources))
      .subarray(0, 2)
      .toString(),
    "PK",
  );
  globalThis.fetch = (async () =>
    Response.json(
      { error: { message: "secret provider details" } },
      { status: 429 },
    )) as typeof fetch;
  await assert.rejects(
    generateDeck(workspace, "Java", 4),
    (e: unknown) =>
      e instanceof AppError &&
      e.status === 429 &&
      !e.message.includes("secret"),
  );
  config.openrouterModel = "paid/model";
  await assert.rejects(
    generateDeck(workspace, "Java", 4),
    /must be openrouter\/free/,
  );
  config.openrouterModel = "openrouter/free";
  config.openrouterKey = "";
  await assert.rejects(
    generateDeck(workspace, "Java", 4),
    /Set OPENROUTER_API_KEY/,
  );
});

test("Gemini unavailability falls back to configured OpenRouter for chat and preserves history", async (t) => {
  const originalFetch = globalThis.fetch;
  const previous = {
    provider: config.aiProvider,
    key: config.openrouterKey,
    model: config.openrouterModel,
    gemini: config.geminiKey,
  };
  config.aiProvider = "gemini";
  config.openrouterKey = "test-openrouter";
  config.openrouterModel = "openrouter/free";
  config.geminiKey = "test-gemini";
  t.after(() => {
    globalThis.fetch = originalFetch;
    config.aiProvider = previous.provider;
    config.openrouterKey = previous.key;
    config.openrouterModel = previous.model;
    config.geminiKey = previous.gemini;
  });
  let routerCalls = 0;
  globalThis.fetch = (async (url: unknown, options?: RequestInit) => {
    if (!String(url).includes("openrouter.ai"))
      return Response.json(
        { error: { code: 503, message: "High demand", status: "UNAVAILABLE" } },
        { status: 503 },
      );
    routerCalls++;
    const body = JSON.parse(String(options?.body));
    assert.equal(body.messages[2].role, "assistant");
    assert.match(body.messages[1].content, /revising Java/);
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              text: "Inheritance explained",
              resourceIds: ["invented"],
              youtubeQuery: "",
            }),
          },
        },
      ],
    });
  }) as typeof fetch;
  const result = await chat(workspace, "Java", false);
  assert.equal(result.text, "Inheritance explained");
  assert.deepEqual(result.resources, []);
  assert.equal(routerCalls, 1);
});
