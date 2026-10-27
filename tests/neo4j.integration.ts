import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import neo4j from "neo4j-driver";
import { KnowledgeRepository } from "../server/database";
import { config } from "../server/config";
import { AppError } from "../server/validation";

test(
  "real Neo4j: seed, personal isolation, profile graph edges, persistence, chat, reset and deletion",
  { skip: process.env.RUN_NEO4J_TESTS !== "1" },
  async (t) => {
    const id = `integration-${randomUUID()}`;
    const other = `integration-${randomUUID()}`;
    const repo = new KnowledgeRepository();
    const cleanup = neo4j.driver(
      config.neo4jUri,
      neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
    );
    t.after(async () => {
      await cleanup.executeQuery(
        "MATCH (n) WHERE n.id IN $ids OR n.ownerId IN $ids OR EXISTS { MATCH (u:Learner)-[:SENT]->(n) WHERE u.id IN $ids } DETACH DELETE n",
        { ids: [id, other] },
        { database: config.neo4jDatabase },
      );
      await cleanup.close();
      await repo.close();
    });
    const first = await repo.workspace(id);
    assert.equal(first.courses.length, 7);
    assert.equal(first.concepts.length, 15);
    assert.equal(first.resources.filter((r) => !r.personal).length, 44);
    const profile = {
      level: "advanced" as const,
      goal: "OOP exam",
      knownConceptIds: ["ds-core", "oop-java"],
    };
    await repo.saveProfile(id, profile);
    assert.deepEqual(
      (await repo.workspace(id)).profile.knownConceptIds.sort(),
      profile.knownConceptIds.sort(),
    );
    await repo.saveProfile(id, { ...profile, knownConceptIds: [] });
    assert.deepEqual((await repo.workspace(id)).profile.knownConceptIds, []);
    await assert.rejects(
      repo.saveProfile(id, { ...profile, knownConceptIds: ["invalid"] }),
    );
    const note = await repo.addResource(id, {
      title: "Integration note",
      type: "notes",
      summary: "Java example",
      courseId: "oop",
      conceptIds: ["oop-java"],
      content: "Personal inheritance example",
      url: "",
      source: "Personal",
    });
    assert.ok(
      (await repo.workspace(id)).resources.some(
        (r) => r.id === note.id && r.content?.includes("inheritance"),
      ),
    );
    assert.ok(
      !(await repo.workspace(other)).resources.some((r) => r.id === note.id),
    );
    await assert.rejects(
      repo.deleteResource(other, note.id),
      (error: unknown) => error instanceof AppError && error.status === 404,
    );
    const conversationId = await repo.conversationId(id);
    await repo.appendTurn(id, conversationId, "Hi", {
      text: "Hello",
      resources: [],
      videos: [],
    });
    const secondRepo = new KnowledgeRepository();
    try {
      assert.equal((await secondRepo.workspace(id)).messages.length, 2);
    } finally {
      await secondRepo.close();
    }
    assert.equal((await repo.workspace(other)).messages.length, 0);
    await repo.resetConversation(id);
    assert.equal((await repo.workspace(id)).messages.length, 0);
    await assert.rejects(
      repo.appendTurn(id, conversationId, "old message", {
        text: "old reply",
        resources: [],
        videos: [],
      }),
    );
    await repo.deleteResource(id, note.id);
    assert.ok(
      !(await repo.workspace(id)).resources.some((r) => r.id === note.id),
    );
  },
);
