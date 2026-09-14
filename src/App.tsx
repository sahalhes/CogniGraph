import { useMemo, useState } from "react";
import { AssistantPanel } from "./components/AssistantPanel";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { ResourceSearch } from "./components/ResourceSearch";
import { StatStrip } from "./components/StatStrip";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("KTU S3 OOP question papers");
  const knowledgeBase = useKnowledgeBase();

  const stats = useMemo(() => knowledgeBase.getDashboardStats(), [knowledgeBase]);
  const graph = useMemo(() => knowledgeBase.buildGraph(), [knowledgeBase]);
  const filteredResources = useMemo(() => knowledgeBase.search(query), [knowledgeBase, query]);
  const answer = useMemo(() => knowledgeBase.answer(query), [knowledgeBase, query]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Agentic AI second brain for university students</p>
          <h1>CogniGraph</h1>
        </div>
        <div className="status-pill">KTU S3 demo</div>
      </header>

      <StatStrip stats={stats} />

      <div className="workspace-grid">
        <div className="primary-column">
          <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
          <ResourceSearch query={query} resources={filteredResources} onQueryChange={setQuery} />
        </div>
        <AssistantPanel query={query} answer={answer} onQueryChange={setQuery} />
      </div>
    </main>
  );
}
