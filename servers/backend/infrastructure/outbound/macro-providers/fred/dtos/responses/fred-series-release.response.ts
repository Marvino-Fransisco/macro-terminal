import z from "zod";

export const fredSeriesReleaseResponseSchema = z.object({
  releases: z.array(z.object({ id: z.number().int() })),
});

export type FredSeriesReleaseResponse = z.infer<typeof fredSeriesReleaseResponseSchema>;
