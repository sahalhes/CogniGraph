export type ResourceType =
  | "notes"
  | "lab"
  | "paper"
  | "assignment"
  | "textbook"
  | "capsule"
  | "program"
  | "practice"
  | "record"
  | "extras";

export type AcademicResource = {
  id: string;
  title: string;
  type: ResourceType;
  courseId: string;
  conceptIds: string[];
  summary: string;
  source: string;
  url: string;
  content?: string;
  personal?: boolean;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  semester: string;
};

export type Concept = {
  id: string;
  name: string;
  courseId: string;
  prerequisites: string[];
};

export type GraphNode = {
  id: string;
  label: string;
  kind: "course" | "concept" | "resource" | "conversation";
  x: number;
  y: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  label: string;
};
