import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { courses, concepts, resources } from "../src/data/sampleKnowledgeBase";
import { KnowledgeService } from "../src/services/knowledgeService";
import { graphContext, retrieve } from "../server/retrieval";
import { renderPresentation } from "../server/presentation";
import { resourceSchema, presentationSchema } from "../server/validation";
import type { Workspace } from "../src/domain/workspace";
const workspace: Workspace = {
  courses,
  concepts,
  resources,
  profile: {
    level: "beginner",
    goal: "Learn Java",
    knownConceptIds: ["ds-core"],
  },
  messages: [],
};

test("graph IDs remain unique across courses, concepts and resources; every endpoint exists", () => {
  const service = new KnowledgeService(courses, concepts, resources);
  const graph = service.buildGraph();
  const ids = new Set(graph.nodes.map((n) => n.id));
  assert.equal(ids.size, graph.nodes.length);
  assert.ok(graph.edges.every((e) => ids.has(e.from) && ids.has(e.to)));
  assert.ok(graph.edges.every((e) => e.from !== e.to));
  assert.equal(service.getDashboardStats().links, graph.edges.length);
  assert.equal(graph.nodes.length, 66);
});
test("retrieval finds personal note content and expands recursive prerequisites with known markers", () => {
  const personal = {
    id: "personal-note",
    title: "Custom lab",
    summary: "Notes",
    type: "notes" as const,
    courseId: "oop",
    conceptIds: ["oop-modules"],
    source: "Personal",
    url: "",
    content: "The special technique is method overriding.",
  };
  const input = { ...workspace, resources: [...resources, personal] };
  assert.equal(retrieve(input, "special technique")[0].id, personal.id);
  const context = graphContext(input, "special technique");
  assert.ok(context.concepts.some((c) => c.id === "oop-java"));
  assert.ok(context.concepts.some((c) => c.id === "ds-core" && c.alreadyKnown));
  assert.deepEqual(retrieve(input, "zzzz-unfindable"), []);
});
test("retrieval terminates on cyclic prerequisites", () => {
  const cyclic = {
    ...workspace,
    concepts: concepts.map((c) =>
      c.id === "ds-core" ? { ...c, prerequisites: ["oop-java"] } : c,
    ),
  };
  assert.ok(
    graphContext(cyclic, "Java module").concepts.length <= concepts.length,
  );
});
test("resource validation rejects executable links and missing concepts; presentation limits are enforced", () => {
  const input = {
    title: "x",
    summary: "x",
    type: "notes",
    courseId: "ds",
    conceptIds: ["ds-core"],
    url: "javascript:alert(1)",
  };
  assert.equal(resourceSchema.safeParse(input).success, false);
  assert.equal(
    resourceSchema.safeParse({ ...input, url: "", conceptIds: [] }).success,
    false,
  );
  assert.equal(resourceSchema.safeParse({ ...input, url: "" }).success, true);
  assert.equal(
    presentationSchema.safeParse({ topic: "Java", slideCount: 100 }).success,
    false,
  );
});
test("PowerPoint is a real ZIP package with slides, speaker notes, escaped text and grounded references", async () => {
  const deck = {
    title: "Java & OOP",
    slides: Array.from({ length: 4 }, (_, i) => ({
      title: `Slide ${i + 1} <Java>`,
      bullets: ["Inheritance & polymorphism", "A short example"],
      notes: "Detailed speaker explanation",
      resourceIds: ["oop-textbook", "invented"],
    })),
  };
  const buffer = await renderPresentation(deck, resources);
  const zip = await JSZip.loadAsync(buffer);
  assert.equal(
    Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name),
    ).length,
    4,
  );
  const slide = await zip.file("ppt/slides/slide1.xml")!.async("string");
  const notes = await zip
    .file("ppt/notesSlides/notesSlide1.xml")!
    .async("string");
  assert.ok(slide.includes("&lt;Java&gt;"));
  assert.ok(notes.includes("Detailed speaker explanation"));
  assert.ok(notes.includes("OOP Java textbook folder"));
  assert.ok(!notes.includes("invented"));
});

test("saved conversations become graph nodes linked to cited database resources", () => {
  const source = resources[0];
  const messages: Workspace["messages"] = [
    { id: "turn-1", role: "user", text: "Help me study", resources: [], videos: [], createdAt: "2026-10-27" },
    { id: "reply-1", role: "assistant", text: "Here is a reference", resources: [source], videos: [], createdAt: "2026-10-27" },
  ];
  const graph = new KnowledgeService(courses, concepts, resources, messages).buildGraph();
  assert.ok(graph.nodes.some(n => n.id === "conversation:turn-1"));
  assert.ok(!graph.nodes.some(n => n.id === "conversation:reply-1"));
  assert.ok(graph.edges.some(e => e.from === "conversation:turn-1" && e.to === `resource:${source.id}`));
  const ids = new Set(graph.nodes.map(n => n.id));
  assert.ok(graph.edges.every(e => ids.has(e.from) && ids.has(e.to)));
  assert.ok(!new KnowledgeService(courses, concepts, resources).buildGraph().nodes.some(n => n.kind === "conversation"));
});
