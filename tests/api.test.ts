import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { courses, concepts, resources } from "../src/data/sampleKnowledgeBase";
import type {
  ChatMessage,
  ChatReply,
  Workspace,
} from "../src/domain/workspace";
import { AppError } from "../server/validation";

function fixture() {
  const users = new Map<string, Workspace>();
  const get = (id: string) => {
    if (!users.has(id))
      users.set(id, {
        courses,
        concepts,
        resources: [...resources],
        profile: { level: "beginner", goal: "", knownConceptIds: [] },
        messages: [],
      });
    return users.get(id)!;
  };
  return {
    health: async () => true,
    workspace: async (id: string) => get(id),
    saveProfile: async (id: string, profile: Workspace["profile"]) => {
      get(id).profile = profile;
    },
    addResource: async (
      id: string,
      input: Omit<Workspace["resources"][number], "id">,
    ) => {
      const r = { ...input, id: "personal", personal: true };
      get(id).resources.push(r);
      return r;
    },
    deleteResource: async (id: string, resourceId: string) => {
      const w = get(id);
      if (!w.resources.some((r) => r.id === resourceId && r.personal))
        throw new AppError(404, "Personal resource not found.");
      w.resources = w.resources.filter((r) => r.id !== resourceId);
    },
    conversationId: async () => "conversation",
    appendTurn: async (
      id: string,
      _conversationId: string,
      message: string,
      reply: ChatReply,
    ) => {
      const messages: ChatMessage[] = [
        {
          id: "u",
          role: "user",
          text: message,
          resources: [],
          videos: [],
          createdAt: "",
        },
        { id: "a", role: "assistant", ...reply, createdAt: "" },
      ];
      get(id).messages.push(...messages);
      return messages;
    },
    resetConversation: async (id: string) => {
      get(id).messages = [];
    },
  };
}
test("API validates input, persists turns, isolates sessions, rejects cross-origin writes and returns PPTX", async (t) => {
  const app = createApp({
    repository: fixture(),
    chat: async (_w, message) => ({
      text: `Reply: ${message}`,
      resources: [resources[0]],
      videos: [],
    }),
    generateDeck: async () => ({
      deck: {
        title: "Java",
        slides: Array.from({ length: 4 }, () => ({
          title: "OOP",
          bullets: ["Example"],
          notes: "Notes",
          resourceIds: [],
        })),
      },
      resources: [],
    }),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const first = await fetch(`${base}/workspace`);
  const cookie = first.headers.get("set-cookie")!.split(";")[0];
  assert.ok(first.headers.get("set-cookie")!.includes("HttpOnly"));
  assert.ok(first.headers.get("set-cookie")!.includes("SameSite=Strict"));
  const send = (
    path: string,
    body: unknown,
    method = "POST",
    extra: Record<string, string> = {},
  ) =>
    fetch(base + path, {
      method,
      headers: { Cookie: cookie, "Content-Type": "application/json", ...extra },
      body: JSON.stringify(body),
    });
  assert.equal((await send("/chat", { message: " " })).status, 400);
  assert.equal(
    (
      await send("/chat", { message: "Hello" }, "POST", {
        Origin: "https://evil.test",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await send("/chat", { message: "Explain Java" }, "POST", {
        Origin: config.origin,
      })
    ).status,
    200,
  );
  const history = (await (
    await fetch(`${base}/workspace`, { headers: { Cookie: cookie } })
  ).json()) as Workspace;
  assert.equal(history.messages.length, 2);
  assert.equal(
    ((await (await fetch(`${base}/workspace`)).json()) as Workspace).messages
      .length,
    0,
  );
  assert.equal(
    (
      (await (
        await fetch(`${base}/workspace`, {
          headers: {
            Cookie: cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0"),
          },
        })
      ).json()) as Workspace
    ).messages.length,
    0,
  );
  assert.equal(
    (await send("/resources/ds-notes", undefined, "DELETE")).status,
    404,
  );
  const ppt = await send("/presentations", { topic: "Java", slideCount: 4 });
  assert.equal(ppt.status, 200);
  assert.ok(ppt.headers.get("content-type")?.includes("presentationml"));
  assert.equal(
    Buffer.from(await ppt.arrayBuffer())
      .subarray(0, 2)
      .toString(),
    "PK",
  );
  assert.equal((await send("/chat", undefined, "DELETE")).status, 200);
  assert.equal(
    (
      (await (
        await fetch(`${base}/workspace`, { headers: { Cookie: cookie } })
      ).json()) as Workspace
    ).messages.length,
    0,
  );
  assert.equal((await fetch(`${base}/unknown`)).status, 404);
});
test("failed AI requests do not save a false successful conversation", async (t) => {
  const repo = fixture();
  const app = createApp({
    repository: repo,
    chat: async () => {
      throw new AppError(429, "Quota reached");
    },
    generateDeck: async () => {
      throw new Error();
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  );
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const r = await fetch(`${base}/workspace`);
  const cookie = r.headers.get("set-cookie")!.split(";")[0];
  const failed = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hi" }),
  });
  assert.equal(failed.status, 429);
  assert.deepEqual(await failed.json(), { error: "Quota reached" });
  const w = (await (
    await fetch(`${base}/workspace`, { headers: { Cookie: cookie } })
  ).json()) as Workspace;
  assert.equal(w.messages.length, 0);
});
