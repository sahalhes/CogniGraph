import type { AcademicResource, Concept, Course, GraphEdge, GraphNode } from "../domain/academic";

export class KnowledgeService {
  private readonly courses: Course[];
  private readonly concepts: Concept[];
  private readonly resources: AcademicResource[];

  constructor(
    courses: Course[],
    concepts: Concept[],
    resources: AcademicResource[],
  ) {
    this.courses = courses;
    this.concepts = concepts;
    this.resources = resources;
  }

  getDashboardStats() {
    return {
      courses: this.courses.length,
      concepts: this.concepts.length,
      resources: this.resources.length,
      links: this.concepts.reduce((sum, concept) => sum + concept.prerequisites.length, 0) + this.resources.length,
    };
  }

  search(query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.resources;
    const terms = normalized.split(/\s+/).filter(Boolean);

    return this.resources.filter((resource) => {
      const course = this.findCourse(resource.courseId);
      const conceptNames = resource.conceptIds.map((id) => this.findConcept(id)?.name ?? "").join(" ");
      const searchable = `${resource.title} ${resource.summary} ${resource.type} ${resource.source} ${course?.code ?? ""} ${course?.name ?? ""} ${course?.semester ?? ""} ${conceptNames}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }

  answer(query: string) {
    const matches = this.search(query).slice(0, 3);
    if (!query.trim()) {
      return "Ask about a KTU subject, module, lab, capsule, assignment, or question paper to retrieve the linked resources.";
    }

    if (matches.length === 0) {
      return "I could not find a direct match yet. Try a subject code like DS, DMS, OOP, LSD, DE, SE, or a material type like capsule, notes, lab, or university paper.";
    }

    const concepts = new Set(matches.flatMap((resource) => resource.conceptIds));
    const prerequisiteNames = [...concepts]
      .flatMap((id) => this.findConcept(id)?.prerequisites ?? [])
      .map((id) => this.findConcept(id)?.name)
      .filter(Boolean);

    const resourceLine = matches.map((resource) => resource.title).join("; ");
    const prereqLine = prerequisiteNames.length ? ` Review prerequisites first: ${[...new Set(prerequisiteNames)].join(", ")}.` : "";
    return `Best KTU matches: ${resourceLine}.${prereqLine}`;
  }

  buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [
      ...this.courses.map((course, index) => ({
        id: course.id,
        label: course.code,
        kind: "course" as const,
        x: 90,
        y: 95 + index * 110,
      })),
      ...this.concepts.map((concept, index) => ({
        id: concept.id,
        label: concept.name,
        kind: "concept" as const,
        x: 310 + (index % 2) * 90,
        y: 70 + index * 58,
      })),
      ...this.resources.map((resource, index) => ({
        id: resource.id,
        label: resource.title,
        kind: "resource" as const,
        x: 650,
        y: 90 + index * 90,
      })),
    ];

    const edges: GraphEdge[] = [
      ...this.concepts.map((concept) => ({ from: concept.courseId, to: concept.id, label: "contains" })),
      ...this.concepts.flatMap((concept) =>
        concept.prerequisites.map((prerequisite) => ({ from: prerequisite, to: concept.id, label: "prereq" })),
      ),
      ...this.resources.flatMap((resource) =>
        resource.conceptIds.map((conceptId) => ({ from: conceptId, to: resource.id, label: "supports" })),
      ),
    ];

    return { nodes, edges };
  }

  private findCourse(id: string) {
    return this.courses.find((course) => course.id === id);
  }

  private findConcept(id: string) {
    return this.concepts.find((concept) => concept.id === id);
  }
}
