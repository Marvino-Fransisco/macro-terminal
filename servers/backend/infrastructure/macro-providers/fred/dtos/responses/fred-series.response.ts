import z from "zod";

export const fredSeriesResponseSchema = z.object({
  seriess: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      units: z.string(),
      frequency_short: z.string(),
      seasonal_adjustment_short: z.string(),
      notes: z.string().optional(),
      last_updated: z.string(),
    }),
  ),
});

export type FredSeriesResponse = z.infer<typeof fredSeriesResponseSchema>;
