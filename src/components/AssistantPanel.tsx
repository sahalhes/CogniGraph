import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Download,
  LoaderCircle,
  Send,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import Markdown from "react-markdown";
import type { ChatMessage } from "../domain/workspace";
import { api } from "../services/api";
type Props = {
  messages: ChatMessage[];
  enabled: boolean;
  onMessages: (messages: ChatMessage[]) => void;
};
export function AssistantPanel({ messages, enabled, onMessages }: Props) {
  const [mode, setMode] = useState<"chat" | "slides">("chat");
  const [draft, setDraft] = useState("");
  const [includeVideos, setIncludeVideos] = useState(true);
  const [slideCount, setSlideCount] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || lock.current || !enabled) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "chat") {
        const result = await api.chat(draft.trim(), includeVideos);
        onMessages([...messages, ...result.messages]);
        setDraft("");
      } else {
        const response = await api.presentation(draft.trim(), slideCount);
        const url = URL.createObjectURL(await response.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("Content-Disposition")
            ?.match(/filename="([^"]+)"/)?.[1] || "cognigraph-study.pptx";
        document.body.append(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice(
          "Presentation downloaded. Speaker notes include explanations and saved references.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reset() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api.resetChat();
      onMessages([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="panel assistant-panel">
      <div className="assistant-title">
        <Brain size={24} aria-hidden="true" />
        <div>
          <p className="eyebrow">Your personal study companion</p>
          <h2>Ask CogniGraph</h2>
        </div>
        <button
          className="icon-button"
          onClick={reset}
          disabled={busy || !enabled || !messages.length}
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <Trash2 size={17} />
        </button>
      </div>
      <div className="mode-switch" aria-label="Assistant mode">
        <button
          aria-pressed={mode === "chat"}
          onClick={() => setMode("chat")}
          disabled={busy}
        >
          <Sparkles size={15} /> Chat
        </button>
        <button
          aria-pressed={mode === "slides"}
          onClick={() => setMode("slides")}
          disabled={busy}
        >
          <Download size={15} /> Create PPT
        </button>
      </div>
      {mode === "chat" ? (
        <div
          className="chat-history"
          role="log"
          aria-label="Study conversation"
          aria-live="polite"
          aria-busy={busy}
        >
          {!messages.length && (
            <div className="chat-welcome">
              <Sparkles size={26} />
              <h3>A study plan that starts with you.</h3>
              <p>
                Ask for an explanation, revision plan, or learning resources.
                Your saved notes and learning profile help shape each answer.
              </p>
              {[
                "Explain Java inheritance with an example",
                "Help me revise Data Structures",
                "Recommend videos about digital logic",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setDraft(prompt)}
                  disabled={busy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {messages.map((message) => (
            <article
              className={`chat-message ${message.role}`}
              key={message.id}
            >
              <small>{message.role === "user" ? "You" : "CogniGraph"}</small>
              <Markdown
                allowedElements={[
                  "p",
                  "strong",
                  "em",
                  "ul",
                  "ol",
                  "li",
                  "code",
                  "pre",
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "blockquote",
                  "hr",
                  "br",
                ]}
                unwrapDisallowed
              >
                {message.text}
              </Markdown>
              {!!message.resources.length && (
                <div className="chat-sources">
                  <strong>From your knowledge base</strong>
                  {message.resources.map((r) =>
                    r.url ? (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.title} ↗
                      </a>
                    ) : (
                      <span key={r.id}>{r.title} · saved notes</span>
                    ),
                  )}
                </div>
              )}
              {!!message.videos.length && (
                <div className="chat-sources video-sources">
                  <strong>
                    <Video size={15} />{" "}
                    {message.videos[0].kind === "search"
                      ? "YouTube search"
                      : "YouTube recommendations"}
                  </strong>
                  {message.videos.map((video) => (
                    <a
                      key={video.url}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {video.title}
                      {video.channel && <small>{video.channel}</small>} ↗
                    </a>
                  ))}
                  {message.videoNotice && <small>{message.videoNotice}</small>}
                </div>
              )}
            </article>
          ))}
          {busy && (
            <p className="working">
              <LoaderCircle className="spin" size={16} /> Thinking through your
              knowledge graph…
            </p>
          )}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="ppt-intro">
          <Download size={30} />
          <h3>Turn a topic into a study deck.</h3>
          <p>
            Get an editable PowerPoint with examples, a recap, and detailed
            speaker notes, tailored to your learning profile and saved
            materials.
          </p>
          <label>
            Number of slides
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              disabled={busy}
            >
              {Array.from({ length: 9 }, (_, i) => i + 4).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {!enabled && (
        <p className="setup-note">
          Connect Neo4j and configure GEMINI_API_KEY in .env to enable the
          assistant.
        </p>
      )}
      <form onSubmit={submit} className="assistant-form">
        <label htmlFor="assistant-prompt" className="sr-only">
          {mode === "chat" ? "Message" : "Presentation topic"}
        </label>
        <textarea
          id="assistant-prompt"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={mode === "chat" ? 6000 : 1000}
          placeholder={
            mode === "chat"
              ? "What would you like to understand?"
              : "e.g. Java inheritance and polymorphism"
          }
          rows={3}
          disabled={busy}
        />
        <div className="assistant-actions">
          {mode === "chat" ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeVideos}
                onChange={(e) => setIncludeVideos(e.target.checked)}
                disabled={busy}
              />{" "}
              Include YouTube
            </label>
          ) : (
            <span>Editable .pptx</span>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={busy || !enabled || !draft.trim()}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : mode === "chat" ? (
              <Send size={16} />
            ) : (
              <Download size={16} />
            )}
            {busy ? "Working…" : mode === "chat" ? "Send" : "Generate"}
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      {mode === "slides" && busy && (
        <p role="status" className="working">
          Building your slides. This can take up to a minute…
        </p>
      )}
      <p className="assistant-footnote">
        AI can make mistakes. Check important details against your syllabus.
      </p>
    </section>
  );
}
