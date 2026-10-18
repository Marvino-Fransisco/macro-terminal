import z from "zod";

export const worldBankObservationResponseSchema = z.object({
  countryiso3code: z.string(),
  date: z.string(),
  value: z.union([z.number(), z.null()]),
});

export type WorldBankObservationResponse = z.infer<typeof worldBankObservationResponseSchema>;
