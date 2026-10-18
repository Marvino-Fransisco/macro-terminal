import dotenv from "dotenv";
import z from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, "DATABASE_URL cannot be empty"),
  FRED_API_KEY: z.string().optional(),
  BLS_API_KEY: z.string().optional(),
  BEA_USER_ID: z.string().optional(),
  CENSUS_API_KEY: z.string().optional(),
  EIA_API_KEY: z.string().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

type Env = z.infer<typeof envSchema>;

export const ENV: Env = envSchema.parse(process.env);
