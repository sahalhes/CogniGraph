import type { Workspace } from "../src/domain/workspace";

const stopWords = new Set(
  "a an the i me my you can please explain teach help what how should learn about for to of in and with is are before generate create presentation slides ppt recommend videos resources".split(
    " ",
  ),
);
export function retrieve(workspace: Workspace, query: string) {
  const terms = [
    ...new Set(query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []),
  ].filter((t) => !stopWords.has(t));
  const ranked = workspace.resources
    .map((resource) => {
      const course = workspace.courses.find((c) => c.id === resource.courseId);
      const concepts = workspace.concepts.filter((c) =>
        resource.conceptIds.includes(c.id),
      );
      const title =
        `${resource.title} ${course?.code} ${course?.name} ${concepts.map((c) => c.name).join(" ")}`.toLowerCase();
      const body =
        `${resource.summary} ${resource.content || ""} ${resource.type}`.toLowerCase();
      const score = terms.reduce(
        (sum, term) =>
          sum + (title.includes(term) ? 3 : 0) + (body.includes(term) ? 1 : 0),
        0,
      );
      return { resource, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  return ranked.map((item) => item.resource);
}

export function graphContext(workspace: Workspace, query: string) {
  const resources = retrieve(workspace, query);
  const related = new Set(resources.flatMap((r) => r.conceptIds));
  // Recursively traverse the saved prerequisite graph, with cycle protection.
  const visit = (id: string) => {
    const c = workspace.concepts.find((c) => c.id === id);
    for (const prerequisite of c?.prerequisites || []) {
      if (!related.has(prerequisite)) {
        related.add(prerequisite);
        visit(prerequisite);
      }
    }
  };
  [...related].forEach(visit);
  return {
    profile: workspace.profile,
    courses: workspace.courses,
    concepts: workspace.concepts
      .filter((c) => related.has(c.id))
      .map((c) => ({
        ...c,
        alreadyKnown: workspace.profile.knownConceptIds.includes(c.id),
      })),
    resources: resources.map((r) => ({
      ...r,
      content: r.content?.slice(0, 8000),
    })),
  };
}
