import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, "DATABASE_URL cannot be empty"),
});

type Env = z.infer<typeof envSchema>;

export const ENV: Env = envSchema.parse(process.env);
