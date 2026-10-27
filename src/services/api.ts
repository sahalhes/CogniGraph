import type { AcademicResource } from "../domain/academic";
import type {
  ChatMessage,
  Health,
  Profile,
  Workspace,
} from "../domain/workspace";
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: method === "GET" ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(270000),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection and that npm run dev is running.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status}).`);
  }
  if (path === "/presentations") return response as T;
  try {
    return await response.json();
  } catch {
    throw new Error(
      "The API returned an invalid response. Check that the backend is running.",
    );
  }
}
export const api = {
  health: () => request<Health>("/health"),
  workspace: () => request<Workspace>("/workspace"),
  profile: (profile: Profile) => request("/profile", "PUT", profile),
  addResource: (resource: Omit<AcademicResource, "id">) =>
    request<AcademicResource>("/resources", "POST", resource),
  deleteResource: (id: string) =>
    request(`/resources/${encodeURIComponent(id)}`, "DELETE"),
  chat: (message: string, includeVideos: boolean) =>
    request<{ messages: ChatMessage[] }>("/chat", "POST", {
      message,
      includeVideos,
    }),
  resetChat: () => request("/chat", "DELETE"),
  presentation: (topic: string, slideCount: number) =>
    request<Response>("/presentations", "POST", { topic, slideCount }),
};
