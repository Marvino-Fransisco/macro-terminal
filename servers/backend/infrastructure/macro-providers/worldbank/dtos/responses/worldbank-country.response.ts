import z from "zod";

export const worldBankCountryResponseSchema = z.object({
  id: z.string().regex(/^[A-Z]{3}$/),
  iso2Code: z.string(),
  name: z.string(),
  region: z.object({ id: z.string(), value: z.string() }),
});

export type WorldBankCountryResponse = z.infer<typeof worldBankCountryResponseSchema>;
