import { ENV } from "@/configs/env";
import { EmptyRelations } from "drizzle-orm";
import { PgAsyncTransaction } from "drizzle-orm/pg-core";
import { drizzle, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export async function createSupabaseConnection() {
  const client = postgres(ENV.DATABASE_URL, { prepare: false });
  const db = drizzle({ client });

  await db.execute("SELECT 1");

  return db;
}

export type Database = Awaited<ReturnType<typeof createSupabaseConnection>>;
export type Transaction = PgAsyncTransaction<PostgresJsQueryResultHKT,EmptyRelations>;
export type DatabaseContext = Database | Transaction;
