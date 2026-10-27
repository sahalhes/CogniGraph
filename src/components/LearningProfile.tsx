import { useState } from "react";
import { Check, ChevronDown, GraduationCap } from "lucide-react";
import type { Concept } from "../domain/academic";
import type { Profile } from "../domain/workspace";
import { api } from "../services/api";
type Props = {
  profile: Profile;
  concepts: Concept[];
  enabled: boolean;
  onSaved: (profile: Profile) => void;
};
export function LearningProfile({
  profile,
  concepts,
  enabled,
  onSaved,
}: Props) {
  const [draft, setDraft] = useState(profile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api.profile(draft);
      onSaved(draft);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel profile-panel">
      <summary>
        <span>
          <GraduationCap size={20} /> Your learning profile
        </span>
        <ChevronDown size={17} />
      </summary>
      <p className="muted">
        Tell the tutor where you are starting. Familiar concepts help it choose
        the next steps.
      </p>
      <form onSubmit={save}>
        <label>
          Experience
          <select
            value={draft.level}
            disabled={!enabled || busy}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, level: e.target.value as Profile["level"] });
            }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label>
          Learning goal
          <textarea
            value={draft.goal}
            maxLength={1000}
            disabled={!enabled || busy}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, goal: e.target.value });
            }}
            placeholder="e.g. Prepare for OOP exams in two weeks"
            rows={2}
          />
        </label>
        <fieldset disabled={!enabled || busy}>
          <legend>Concepts I already know</legend>
          <div className="concept-checks">
            {concepts.map((c) => (
              <label className="checkbox-label" key={c.id}>
                <input
                  type="checkbox"
                  checked={draft.knownConceptIds.includes(c.id)}
                  onChange={(e) => {
                    setSaved(false);
                    setDraft({
                      ...draft,
                      knownConceptIds: e.target.checked
                        ? [...draft.knownConceptIds, c.id]
                        : draft.knownConceptIds.filter((id) => id !== c.id),
                    });
                  }}
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          className="primary-button"
          disabled={!enabled || busy}
        >
          <Check size={16} />
          {busy ? "Saving…" : saved ? "Saved" : "Save profile"}
        </button>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
