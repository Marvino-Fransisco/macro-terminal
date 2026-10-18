import z from "zod";

export const worldBankIndicatorResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  sourceNote: z.string().optional(),
});

export type WorldBankIndicatorResponse = z.infer<typeof worldBankIndicatorResponseSchema>;
