import { ENV } from "@/configs/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export async function createSupabaseConnection() {
  const client = postgres(ENV.DATABASE_URL, { prepare: false });
  const db = drizzle({ client });
  return db;
}
