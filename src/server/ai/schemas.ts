import * as z from "zod";

export const NoteDraft = z.object({
  note: z.string().max(400), // to the student, second person, 60 words max
  evidence: z
    .array(
      z.object({
        competencyPosition: z.number().int().min(1).max(5),
        sentence: z.string().max(200).nullable(), // past tense, 25 words max
      }),
    )
    .length(5),
});

export const PlainClassification = z.object({
  summary: z.string().max(320), // 50 words max, grade 8 reading level
  dayToDay: z.array(z.string().max(120)).min(3).max(5),
  whatYouNeed: z.array(z.string().max(120)).min(2).max(5),
});

export const CourseMapping = z.object({
  matches: z
    .array(
      z.object({
        classificationCode: z.string(),
        reason: z.string().max(140), // 20 words max
        courses: z.array(z.string()).max(5),
      }),
    )
    .max(3),
});

export type NoteDraft = z.infer<typeof NoteDraft>;
export type PlainClassification = z.infer<typeof PlainClassification>;
export type CourseMapping = z.infer<typeof CourseMapping>;

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
