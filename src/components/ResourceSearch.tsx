import { useState } from "react";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import type { AcademicResource } from "../domain/academic";

type ResourceSearchProps = {
  query: string;
  resources: AcademicResource[];
  onQueryChange: (query: string) => void;
  onDelete: (id: string) => Promise<void>;
};

export function ResourceSearch({
  query,
  resources,
  onQueryChange,
  onDelete,
}: ResourceSearchProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  return (
    <section className="panel resource-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Semantic retrieval</p>
          <h2>Academic resources</h2>
        </div>
        <span>{resources.length} matches</span>
      </div>

      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search academic resources"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search subjects, concepts, notes, question papers…"
        />
      </label>

      <div className="resource-list">
        {!resources.length && (
          <p className="muted">
            No matching resources. Try a course code or a shorter query.
          </p>
        )}
        {resources.map((resource) => (
          <article className="resource-item" key={resource.id}>
            <div>
              <span className={`resource-type ${resource.type}`}>
                {resource.type}
              </span>
              <h3>{resource.title}</h3>
            </div>
            <p>{resource.summary}</p>
            {resource.content && (
              <details className="saved-notes">
                <summary>Read saved notes</summary>
                <p>{resource.content}</p>
              </details>
            )}
            <div className="resource-footer">
              <small>
                {resource.source}
                {resource.personal ? " · Personal" : ""}
              </small>
              <div className="resource-controls">
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${resource.title}`}
                  >
                    <ExternalLink size={15} aria-hidden="true" />
                    Open
                  </a>
                )}
                {resource.personal && (
                  <button
                    className="icon-button"
                    aria-label={`Delete ${resource.title}`}
                    disabled={!!deleting}
                    onClick={async () => {
                      setDeleting(resource.id);
                      try {
                        await onDelete(resource.id);
                      } finally {
                        setDeleting(null);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
