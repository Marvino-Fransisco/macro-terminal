import z from "zod";

export const fredReleaseDatesResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  release_dates: z.array(
    z.object({
      release_id: z.number(),
      release_name: z.string(),
      date: z.string(),
    }),
  ),
});

export type FredReleaseDatesResponse = z.infer<typeof fredReleaseDatesResponseSchema>;
