import { useMemo } from "react";
import { concepts, courses, resources } from "../data/sampleKnowledgeBase";
import { KnowledgeService } from "../services/knowledgeService";

export function useKnowledgeBase() {
  return useMemo(() => new KnowledgeService(courses, concepts, resources), []);
}
