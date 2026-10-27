import type { AcademicResource, Concept, Course } from "./academic";

export type Profile = {
  level: "beginner" | "intermediate" | "advanced";
  goal: string;
  knownConceptIds: string[];
};
export type Video = {
  title: string;
  url: string;
  channel?: string;
  kind: "video" | "search";
};
export type ChatReply = {
  text: string;
  resources: AcademicResource[];
  videos: Video[];
  videoNotice?: string;
};
export type ChatMessage = ChatReply & {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
};
export type Workspace = {
  courses: Course[];
  concepts: Concept[];
  resources: AcademicResource[];
  profile: Profile;
  messages: ChatMessage[];
};
export type Health = {
  database: boolean;
  gemini: boolean;
  aiConfigured?: boolean;
  provider?: string;
  youtube: boolean;
  model: string;
  message?: string;
};
