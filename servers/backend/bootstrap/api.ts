import { Elysia } from "elysia";
import { ENV } from "@/configs/env";
import { createSupabaseConnection } from "@/infrastructure/database/connections/supabase.connection";
import { createMacroRepository } from "@/infrastructure/database/repositories/macro/macro-repository.drizzle";
import { createGetMacro } from "@/modules/macro/application/use-cases/get-macro";
import { createMacroRoutes } from "@/api/http/macro.routes";

async function main() {
  const db = await createSupabaseConnection();
  const app = new Elysia().use(createMacroRoutes(createGetMacro(createMacroRepository(db))));
  try {
    app.listen(ENV.PORT);
  } catch (error) {
    await db.$client.end();
    throw error;
  }
  console.info(`Macro API listening on port ${ENV.PORT}`);
  const stop = async () => {
    await app.stop();
    await db.$client.end();
  };
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      stop().catch((error: unknown) => { console.error("API shutdown failed", error); process.exitCode = 1; });
    });
  }
}

main().catch((error: unknown) => {
  console.error("Macro API failed to start", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
