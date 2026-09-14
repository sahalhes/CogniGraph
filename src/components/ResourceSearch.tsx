import { ExternalLink, Search } from "lucide-react";
import type { AcademicResource } from "../domain/academic";

type ResourceSearchProps = {
  query: string;
  resources: AcademicResource[];
  onQueryChange: (query: string) => void;
};

export function ResourceSearch({ query, resources, onQueryChange }: ResourceSearchProps) {
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
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search graphs, SQL, PYQ, lab..."
        />
      </label>

      <div className="resource-list">
        {resources.map((resource) => (
          <article className="resource-item" key={resource.id}>
            <div>
              <span className={`resource-type ${resource.type}`}>{resource.type}</span>
              <h3>{resource.title}</h3>
            </div>
            <p>{resource.summary}</p>
            <div className="resource-footer">
              <small>{resource.source}</small>
              <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`Open ${resource.title}`}>
                <ExternalLink size={15} aria-hidden="true" />
                Open
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
