import { z } from "zod";

export const profileSchema = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.string().trim().max(1000),
  knownConceptIds: z.array(z.string().max(100)).max(200),
});
export const resourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: z.enum([
    "notes",
    "lab",
    "paper",
    "assignment",
    "textbook",
    "capsule",
    "program",
    "practice",
    "record",
    "extras",
  ]),
  courseId: z.string().min(1).max(100),
  conceptIds: z.array(z.string().max(100)).min(1).max(20),
  summary: z.string().trim().min(1).max(2000),
  content: z.string().trim().max(30000).default(""),
  url: z
    .union([
      z.literal(""),
      z
        .url()
        .refine(
          (value) => /^https?:\/\//i.test(value),
          "Use an HTTP or HTTPS URL",
        ),
    ])
    .default(""),
  source: z.string().trim().min(1).max(100).default("Personal notes"),
});
export const chatSchema = z.object({
  message: z.string().trim().min(1).max(6000),
  includeVideos: z.boolean().default(false),
});
export const presentationSchema = z.object({
  topic: z.string().trim().min(1).max(1000),
  slideCount: z.number().int().min(4).max(12).default(7),
});
export const replySchema = z.object({
  text: z.string().min(1).max(18000),
  resourceIds: z.array(z.string()).max(8),
  youtubeQuery: z.string().max(200),
});
export const deckSchema = z.object({
  title: z.string().min(1).max(100),
  slides: z
    .array(
      z.object({
        title: z.string().min(1).max(90),
        bullets: z.array(z.string().min(1).max(180)).min(1).max(5),
        notes: z.string().max(2500),
        resourceIds: z.array(z.string()).max(4),
      }),
    )
    .min(4)
    .max(12),
});
export type Deck = z.infer<typeof deckSchema>;
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
