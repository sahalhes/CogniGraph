import { Brain, Send } from "lucide-react";

type AssistantPanelProps = {
  query: string;
  answer: string;
  onQueryChange: (query: string) => void;
};

export function AssistantPanel({ query, answer, onQueryChange }: AssistantPanelProps) {
  return (
    <section className="panel assistant-panel">
      <div className="assistant-title">
        <Brain size={22} aria-hidden="true" />
        <div>
          <p className="eyebrow">Agentic study helper</p>
          <h2>Ask CogniGraph</h2>
        </div>
      </div>

      <div className="answer-box">{answer}</div>

      <label className="prompt-box">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="What should I revise before knowledge graphs?"
        />
        <button type="button" aria-label="Use query">
          <Send size={18} />
        </button>
      </label>
    </section>
  );
}
