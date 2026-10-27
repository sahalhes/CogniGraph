import type { ChatMessage } from "../domain/workspace";
import type {
  AcademicResource,
  Concept,
  Course,
  GraphEdge,
  GraphNode,
} from "../domain/academic";

export class KnowledgeService {
  private readonly courses: Course[];
  private readonly concepts: Concept[];
  private readonly resources: AcademicResource[];

  private readonly messages: ChatMessage[];

  constructor(
    courses: Course[],
    concepts: Concept[],
    resources: AcademicResource[],
    messages: ChatMessage[] = [],
  ) {
    this.messages = messages;
    this.courses = courses;
    this.concepts = concepts;
    this.resources = resources;
  }

  getDashboardStats() {
    return {
      courses: this.courses.length,
      concepts: this.concepts.length,
      resources: this.resources.length,
      links: this.buildGraph().edges.length,
    };
  }

  search(query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.resources;
    const terms = normalized.split(/\s+/).filter(Boolean);

    return this.resources.filter((resource) => {
      const course = this.findCourse(resource.courseId);
      const conceptNames = resource.conceptIds
        .map((id) => this.findConcept(id)?.name ?? "")
        .join(" ");
      const searchable =
        `${resource.title} ${resource.summary} ${resource.content ?? ""} ${resource.type} ${resource.source} ${course?.code ?? ""} ${course?.name ?? ""} ${course?.semester ?? ""} ${conceptNames}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }

  buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [
      ...this.courses.map((course, index) => ({
        id: `course:${course.id}`,
        label: course.code,
        kind: "course" as const,
        x: 90,
        y: 95 + index * 110,
      })),
      ...this.concepts.map((concept, index) => ({
        id: `concept:${concept.id}`,
        label: concept.name,
        kind: "concept" as const,
        x: 310 + (index % 2) * 90,
        y: 70 + index * 58,
      })),
      ...this.resources.map((resource, index) => ({
        id: `resource:${resource.id}`,
        label: resource.title,
        kind: "resource" as const,
        x: 650,
        y: 90 + index * 90,
      })),
    ];

    const edges: GraphEdge[] = [
      ...this.concepts.map((concept) => ({
        from: `course:${concept.courseId}`,
        to: `concept:${concept.id}`,
        label: "contains",
      })),
      ...this.concepts.flatMap((concept) =>
        concept.prerequisites.map((prerequisite) => ({
          from: `concept:${prerequisite}`,
          to: `concept:${concept.id}`,
          label: "prereq",
        })),
      ),
      ...this.resources.flatMap((resource) =>
        resource.conceptIds.map((conceptId) => ({
          from: `concept:${conceptId}`,
          to: `resource:${resource.id}`,
          label: "supports",
        })),
      ),
    ];

    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      if (message.role !== "user") continue;
      const id = `conversation:${message.id}`;
      nodes.push({ id, label: message.text, kind: "conversation", x: 0, y: 0 });
      const reply = this.messages[i + 1];
      const cited = reply?.role === "assistant" ? reply.resources : [];
      for (const resource of cited) {
        if (this.resources.some((r) => r.id === resource.id))
          edges.push({ from: id, to: `resource:${resource.id}`, label: "references" });
      }
      for (const concept of this.concepts) {
        if (message.text.toLowerCase().includes(concept.name.toLowerCase()) ||
            cited.some((r) => r.conceptIds.includes(concept.id)))
          edges.push({ from: id, to: `concept:${concept.id}`, label: "discusses" });
      }
    }
    for (const resource of this.resources.filter((r) => !r.conceptIds.length))
      edges.push({ from: `course:${resource.courseId}`, to: `resource:${resource.id}`, label: "contains" });
    return { nodes, edges };
  }

  private findCourse(id: string) {
    return this.courses.find((course) => course.id === id);
  }

  private findConcept(id: string) {
    return this.concepts.find((concept) => concept.id === id);
  }
}
