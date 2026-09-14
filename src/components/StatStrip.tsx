import { BookOpen, Boxes, FileText, Link } from "lucide-react";

type StatStripProps = {
  stats: {
    courses: number;
    concepts: number;
    resources: number;
    links: number;
  };
};

const statItems = [
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "concepts", label: "Concepts", icon: Boxes },
  { key: "resources", label: "Resources", icon: FileText },
  { key: "links", label: "Graph links", icon: Link },
] as const;

export function StatStrip({ stats }: StatStripProps) {
  return (
    <section className="stat-strip" aria-label="Knowledge base summary">
      {statItems.map(({ key, label, icon: Icon }) => (
        <article className="stat-card" key={key}>
          <Icon size={20} aria-hidden="true" />
          <div>
            <strong>{stats[key]}</strong>
            <span>{label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
