import z from "zod";

export const fredObservationsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  observations: z.array(z.object({ date: z.string(), value: z.string() })),
});

export type FredObservationsResponse = z.infer<typeof fredObservationsResponseSchema>;
