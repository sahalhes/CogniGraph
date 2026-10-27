import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AssistantPanel } from "./components/AssistantPanel";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { ResourceSearch } from "./components/ResourceSearch";
import { StatStrip } from "./components/StatStrip";
import { LearningProfile } from "./components/LearningProfile";
import { AddResource } from "./components/AddResource";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { api } from "./services/api";
import "./App.css";
export default function App() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const {
    workspace,
    setWorkspace,
    service,
    health,
    connected,
    loading,
    error: connectionError,
    refresh,
  } = useKnowledgeBase();
  const stats = useMemo(() => service.getDashboardStats(), [service]);
  const graph = useMemo(() => service.buildGraph(), [service]);
  const filteredResources = useMemo(
    () => service.search(query),
    [service, query],
  );
  async function removeResource(id: string) {
    setError("");
    try {
      await api.deleteResource(id);
      setWorkspace((w) => ({
        ...w,
        resources: w.resources.filter((r) => r.id !== id),
      }));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Your knowledge, connected.</p>
          <h1>
            CogniGraph<span className="brand-dot">.</span>
          </h1>
          <p className="tagline">A second brain for your next breakthrough.</p>
        </div>
        <div className="connection-status">
          <span className={`status-pill ${connected ? "online" : ""}`}>
            {loading
              ? "Connecting…"
              : connected
                ? "Neo4j connected"
                : "Catalog preview"}
          </span>
          <span className="model-status">
            {(health?.aiConfigured ?? health?.gemini)
              ? `${health.provider === "openrouter" ? "OpenRouter" : "Gemini"} · ${health.model}`
              : "AI key needed"}
          </span>
        </div>
      </header>
      {(connectionError ||
        (!loading &&
          connected &&
          !(health?.aiConfigured ?? health?.gemini))) && (
        <div className="connection-banner" role="status">
          <p>
            {connectionError ||
              "Knowledge base connected. Add OPENROUTER_API_KEY or GEMINI_API_KEY to .env and restart the server to enable chat and presentations."}
          </p>
          <button
            className="secondary-button"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Reconnect
          </button>
        </div>
      )}
      <StatStrip stats={stats} />
      <div className="workspace-grid">
        <aside className="profile-sidebar" aria-label="Learning profile">
          <LearningProfile
            key={connected ? "connected" : "preview"}
            profile={workspace.profile}
            concepts={workspace.concepts}
            enabled={connected}
            onSaved={(profile) => setWorkspace((w) => ({ ...w, profile }))}
          />
        </aside>
        <div className="primary-column">
          <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
          <AddResource
            courses={workspace.courses}
            concepts={workspace.concepts}
            enabled={connected}
            onSaved={(resource) =>
              setWorkspace((w) => ({
                ...w,
                resources: [...w.resources, resource],
              }))
            }
          />
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <ResourceSearch
            query={query}
            resources={filteredResources}
            onQueryChange={setQuery}
            onDelete={removeResource}
          />
        </div>
        <aside className="study-sidebar">
          <AssistantPanel
            messages={workspace.messages}
            enabled={connected && !!(health?.aiConfigured ?? health?.gemini)}
            onMessages={(messages) => setWorkspace((w) => ({ ...w, messages }))}
          />

        </aside>
      </div>
    </main>
  );
}
