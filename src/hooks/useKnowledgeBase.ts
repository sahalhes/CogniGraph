import { useCallback, useEffect, useMemo, useState } from "react";
import { concepts, courses, resources } from "../data/sampleKnowledgeBase";
import type { Health, Workspace } from "../domain/workspace";
import { KnowledgeService } from "../services/knowledgeService";
import { api } from "../services/api";
const preview: Workspace = {
  courses,
  concepts,
  resources,
  profile: { level: "beginner", goal: "", knownConceptIds: [] },
  messages: [],
};
export function useKnowledgeBase() {
  const [workspace, setWorkspace] = useState<Workspace>(preview);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const status = await api.health();
        if (!active) return;
        setHealth(status);
        if (status.database) {
          const data = await api.workspace();
          if (!active) return;
          setWorkspace(data);
          setConnected(true);
        } else {
          setConnected(false);
          setError(status.message || "Neo4j is unavailable.");
        }
      } catch (e) {
        if (active) {
          setConnected(false);
          setError((e as Error).message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [revision]);
  const service = useMemo(
    () =>
      new KnowledgeService(
        workspace.courses,
        workspace.concepts,
        workspace.resources,
        workspace.messages,
      ),
    [workspace.courses, workspace.concepts, workspace.resources, workspace.messages],
  );
  return {
    workspace,
    setWorkspace,
    health,
    connected,
    loading,
    error,
    refresh,
    service,
  };
}
