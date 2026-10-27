import neo4j, { type Driver } from "neo4j-driver";
import { randomUUID } from "node:crypto";
import { courses, concepts, resources } from "../src/data/sampleKnowledgeBase";
import type { AcademicResource } from "../src/domain/academic";
import type {
  ChatMessage,
  ChatReply,
  Profile,
  Workspace,
} from "../src/domain/workspace";
import { config } from "./config";
import { AppError } from "./validation";

export class KnowledgeRepository {
  private driver: Driver | null = null;
  private initializing: Promise<void> | null = null;
  private initialized = false;

  private getDriver() {
    if (!config.neo4jUri || !config.neo4jPassword)
      throw new AppError(
        503,
        "Configure NEO4J_URI and NEO4J_PASSWORD in .env, then restart the server.",
      );
    this.driver ??= neo4j.driver(
      config.neo4jUri,
      neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
      {
        connectionTimeout: 5000,
        connectionAcquisitionTimeout: 8000,
        maxTransactionRetryTime: 5000,
      },
    );
    return this.driver;
  }

  private async query(cypher: string, params: Record<string, unknown> = {}) {
    return this.getDriver().executeQuery(cypher, params, {
      database: config.neo4jDatabase,
    });
  }

  async ready() {
    if (this.initialized) return;
    if (!this.initializing) {
      this.initializing = this.seed()
        .then(() => {
          this.initialized = true;
        })
        .finally(() => {
          this.initializing = null;
        });
    }
    await this.initializing;
  }

  private async seed() {
    await this.getDriver().verifyConnectivity();
    for (const label of [
      "Course",
      "Concept",
      "Resource",
      "Learner",
      "Message",
    ]) {
      await this.query(
        `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
      );
    }
    // Idempotent catalog seed. User-owned resources are never overwritten.
    const session = this.getDriver().session({
      database: config.neo4jDatabase,
    });
    try {
      await session.executeWrite(async (tx) => {
        await tx.run(
          "UNWIND $rows AS row MERGE (c:Course {id: row.id}) SET c += row",
          { rows: courses },
        );
        await tx.run(
          `UNWIND $rows AS row MERGE (c:Concept {id: row.id}) SET c.name = row.name, c.courseId = row.courseId
          WITH c, row MATCH (course:Course {id: row.courseId}) MERGE (course)-[:CONTAINS]->(c)`,
          { rows: concepts },
        );
        await tx.run(
          `UNWIND $rows AS row MATCH (c:Concept {id: row.id}) UNWIND row.prerequisites AS pid
          MATCH (p:Concept {id: pid}) MERGE (p)-[:PREREQUISITE_OF]->(c)`,
          { rows: concepts },
        );
        await tx.run(
          `UNWIND $rows AS row MERGE (r:Resource {id: row.id}) SET r += row, r.ownerId = 'catalog'
          WITH r, row MATCH (course:Course {id: row.courseId}) MERGE (course)-[:HAS_RESOURCE]->(r)
          WITH r, row UNWIND row.conceptIds AS cid MATCH (c:Concept {id: cid}) MERGE (c)-[:SUPPORTS]->(r)`,
          { rows: resources },
        );
      });
    } finally {
      await session.close();
    }
  }

  async health() {
    try {
      await this.ready();
      await this.getDriver().verifyConnectivity();
      return true;
    } catch {
      return false;
    }
  }

  private async learner(userId: string) {
    await this.ready();
    await this.query(
      `MERGE (u:Learner {id: $userId}) ON CREATE SET u.level = 'beginner', u.goal = '', u.conversationId = $conversationId`,
      { userId, conversationId: randomUUID() },
    );
  }

  async workspace(userId: string): Promise<Workspace> {
    await this.learner(userId);
    const [
      courseResult,
      conceptResult,
      resourceResult,
      profileResult,
      messages,
    ] = await Promise.all([
      this.query("MATCH (c:Course) RETURN properties(c) AS item ORDER BY c.id"),
      this
        .query(`MATCH (c:Concept) OPTIONAL MATCH (p:Concept)-[:PREREQUISITE_OF]->(c)
        RETURN c.id AS id, c.name AS name, c.courseId AS courseId, collect(p.id) AS prerequisites ORDER BY c.id`),
      this.query(
        `MATCH (r:Resource) WHERE r.ownerId = 'catalog' OR r.ownerId = $userId
        RETURN properties(r) AS item ORDER BY r.title`,
        { userId },
      ),
      this.query(
        `MATCH (u:Learner {id: $userId}) OPTIONAL MATCH (u)-[:KNOWS]->(c:Concept)
        RETURN u.level AS level, u.goal AS goal, collect(c.id) AS knownConceptIds`,
        { userId },
      ),
      this.history(userId),
    ]);
    return {
      courses: courseResult.records.map((r) => r.get("item")),
      concepts: conceptResult.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        courseId: r.get("courseId"),
        prerequisites: r.get("prerequisites"),
      })),
      resources: resourceResult.records.map((r) => {
        const { ownerId, ...item } = r.get("item");
        return { ...item, personal: ownerId === userId } as AcademicResource;
      }),
      profile: {
        level: profileResult.records[0].get("level"),
        goal: profileResult.records[0].get("goal"),
        knownConceptIds: profileResult.records[0].get("knownConceptIds"),
      },
      messages,
    };
  }

  async history(userId: string): Promise<ChatMessage[]> {
    const result = await this.query(
      `MATCH (u:Learner {id: $userId})-[:SENT]->(m:Message)
      WHERE m.conversationId = u.conversationId
      RETURN m ORDER BY m.sequence DESC LIMIT 40`,
      { userId },
    );
    return result.records
      .reverse()
      .map((r) => JSON.parse(r.get("m").properties.payload));
  }

  async saveProfile(userId: string, profile: Profile) {
    const workspace = await this.workspace(userId);
    if (
      profile.knownConceptIds.some(
        (id) => !workspace.concepts.some((c) => c.id === id),
      )
    )
      throw new AppError(400, "Unknown concept in learning profile.");
    await this.query(
      `MATCH (u:Learner {id: $userId}) SET u.level = $level, u.goal = $goal
      WITH u OPTIONAL MATCH (u)-[rel:KNOWS]->() DELETE rel
      WITH DISTINCT u UNWIND $knownConceptIds AS cid MATCH (c:Concept {id: cid}) MERGE (u)-[:KNOWS]->(c)`,
      { userId, ...profile },
    );
  }

  async addResource(userId: string, input: Omit<AcademicResource, "id">) {
    const workspace = await this.workspace(userId);
    if (
      !workspace.courses.some((c) => c.id === input.courseId) ||
      input.conceptIds.some(
        (id) =>
          !workspace.concepts.some(
            (c) => c.id === id && c.courseId === input.courseId,
          ),
      )
    ) {
      throw new AppError(
        400,
        "Select concepts belonging to the selected course.",
      );
    }
    const resource = {
      ...input,
      conceptIds: [...new Set(input.conceptIds)],
      id: `personal-${randomUUID()}`,
      ownerId: userId,
    };
    await this.query(
      `CREATE (r:Resource) SET r = $resource
      WITH r MATCH (u:Learner {id: $userId}), (course:Course {id: r.courseId})
      MERGE (u)-[:SAVED]->(r) MERGE (course)-[:HAS_RESOURCE]->(r)
      WITH r UNWIND r.conceptIds AS cid MATCH (c:Concept {id: cid}) MERGE (c)-[:SUPPORTS]->(r)`,
      { userId, resource },
    );
    return { ...input, id: resource.id, personal: true };
  }

  async deleteResource(userId: string, id: string) {
    const result = await this.query(
      `MATCH (r:Resource {id: $id, ownerId: $userId}) DETACH DELETE r RETURN count(*) AS deleted`,
      { userId, id },
    );
    if (!result.records[0]?.get("deleted").toNumber())
      throw new AppError(404, "Personal resource not found.");
  }

  async conversationId(userId: string) {
    await this.learner(userId);
    const result = await this.query(
      "MATCH (u:Learner {id: $userId}) RETURN u.conversationId AS id",
      { userId },
    );
    return result.records[0].get("id") as string;
  }

  async appendTurn(
    userId: string,
    conversationId: string,
    message: string,
    reply: ChatReply,
  ) {
    const now = Date.now();
    const user: ChatMessage = {
      id: randomUUID(),
      role: "user",
      text: message,
      resources: [],
      videos: [],
      createdAt: new Date(now).toISOString(),
    };
    const assistant: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      ...reply,
      createdAt: new Date(now + 1).toISOString(),
    };
    const result = await this.query(
      `MATCH (u:Learner {id: $userId}) WHERE u.conversationId = $conversationId
      UNWIND $messages AS item CREATE (m:Message {id: item.id, payload: item.payload, sequence: item.sequence, conversationId: $conversationId})
      CREATE (u)-[:SENT]->(m) RETURN count(m) AS saved`,
      {
        userId,
        conversationId,
        messages: [user, assistant].map((m, i) => ({
          id: m.id,
          payload: JSON.stringify(m),
          sequence: now + i,
        })),
      },
    );
    if (!result.records[0]?.get("saved").toNumber())
      throw new AppError(
        409,
        "The conversation was reset. Please send the message again.",
      );
    return [user, assistant];
  }

  async resetConversation(userId: string) {
    await this.learner(userId);
    await this.query(
      `MATCH (u:Learner {id: $userId}) SET u.conversationId = $id
      WITH u OPTIONAL MATCH (u)-[:SENT]->(m:Message) DETACH DELETE m`,
      { userId, id: randomUUID() },
    );
  }

  async close() {
    await this.driver?.close();
  }
}

export const repository = new KnowledgeRepository();
