import z from "zod";

export const worldBankEnvelopeResponseSchema = z.tuple([
  z.object({ pages: z.number().int().nonnegative() }),
  z.array(z.unknown()).nullable(),
]);

export type WorldBankEnvelopeResponse = z.infer<typeof worldBankEnvelopeResponseSchema>;
