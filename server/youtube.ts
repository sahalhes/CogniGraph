import type { Video } from "../src/domain/workspace";
import { config } from "./config";

const cache = new Map<string, { expires: number; videos: Video[] }>();
export async function findVideos(
  query: string,
): Promise<{ videos: Video[]; videoNotice?: string }> {
  const search: Video = {
    title: `Search YouTube: ${query}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    kind: "search",
  };
  if (!config.youtubeKey)
    return {
      videos: [search],
      videoNotice:
        "YouTube search link. Configure YOUTUBE_API_KEY for individual video recommendations.",
    };
  const cached = cache.get(query);
  if (cached && cached.expires > Date.now()) return { videos: cached.videos };
  try {
    const params = new URLSearchParams({
      key: config.youtubeKey,
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "4",
      safeSearch: "strict",
      videoEmbeddable: "true",
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("YouTube unavailable");
    const data = (await response.json()) as {
      items?: {
        id?: { videoId?: string };
        snippet?: { title?: string; channelTitle?: string };
      }[];
    };
    const videos: Video[] = (data.items || [])
      .filter((item) => /^[\w-]{11}$/.test(item.id?.videoId || ""))
      .map((item) => ({
        title: item.snippet?.title || "Study video",
        channel: item.snippet?.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id!.videoId}`,
        kind: "video",
      }));
    if (!videos.length)
      return {
        videos: [search],
        videoNotice: "No individual videos found. Try this YouTube search.",
      };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(query, { videos, expires: Date.now() + 15 * 60 * 1000 });
    return { videos };
  } catch {
    return {
      videos: [search],
      videoNotice:
        "YouTube search is unavailable or its quota was reached. Use this search link instead.",
    };
  }
}
