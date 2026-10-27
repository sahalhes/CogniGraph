import { useState } from "react";
import { Plus, X } from "lucide-react";
import type {
  AcademicResource,
  Concept,
  Course,
  ResourceType,
} from "../domain/academic";
import { api } from "../services/api";
type Props = {
  courses: Course[];
  concepts: Concept[];
  enabled: boolean;
  onSaved: (resource: AcademicResource) => void;
};
export function AddResource({ courses, concepts, enabled, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id || "ds");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const resource = await api.addResource({
        title: String(values.get("title")),
        summary: String(values.get("summary")),
        type: String(values.get("type")) as ResourceType,
        courseId,
        conceptIds: selected,
        content: String(values.get("content")),
        url: String(values.get("url")).trim(),
        source: String(values.get("source")) || "Personal notes",
      });
      onSaved(resource);
      setOpen(false);
      setSelected([]);
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel add-resource-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Make it yours</p>
          <h2>Add to your knowledge base</h2>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setOpen(!open);
            setError("");
          }}
          disabled={!enabled || busy}
        >
          {open ? <X size={16} /> : <Plus size={16} />}
          {open ? "Close" : "Add material"}
        </button>
      </div>
      {!open && (
        <p className="muted">
          Save a resource link or paste your own notes. The tutor uses your
          notes as context; it does not read linked files automatically.
        </p>
      )}
      {open && (
        <form className="resource-form" onSubmit={save}>
          <fieldset disabled={busy} className="resource-fields">
            <label>
              Title
              <input
                name="title"
                required
                maxLength={160}
                placeholder="e.g. My Java inheritance notes"
              />
            </label>
            <div className="form-row">
              <label>
                Course
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setSelected([]);
                  }}
                >
                  {courses.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Material type
                <select name="type">
                  {[
                    "notes",
                    "paper",
                    "textbook",
                    "lab",
                    "practice",
                    "program",
                    "capsule",
                    "assignment",
                    "record",
                    "extras",
                  ].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Linked concepts (choose at least one)</legend>
              {concepts
                .filter((c) => c.courseId === courseId)
                .map((c) => (
                  <label key={c.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, c.id]
                            : selected.filter((id) => id !== c.id),
                        )
                      }
                    />
                    {c.name}
                  </label>
                ))}
            </fieldset>
            <label>
              Summary
              <textarea
                name="summary"
                required
                maxLength={2000}
                rows={2}
                placeholder="What does this material cover?"
              />
            </label>
            <label>
              Your notes (optional)
              <textarea
                name="content"
                maxLength={30000}
                rows={6}
                placeholder="Paste the actual notes you want the tutor to use…"
              />
            </label>
            <label>
              Resource URL (optional)
              <input
                name="url"
                type="url"
                maxLength={2000}
                placeholder="https://…"
              />
            </label>
            <label>
              Source
              <input
                name="source"
                maxLength={100}
                placeholder="Personal notes, Google Drive, textbook…"
              />
            </label>
          </fieldset>
          <p className="muted">
            Saved in this browser's personal workspace. Relevant note excerpts
            are sent to Gemini when you ask a question or create slides.
          </p>
          <button
            className="primary-button"
            type="submit"
            disabled={busy || !selected.length}
          >
            {busy ? "Saving…" : "Save material"}
          </button>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
