import { Elysia, t } from "elysia";
import type { MacroUseCases } from "@/modules/macro/application/use-cases/get-macro";
import { MacroValidationError } from "@/modules/macro/domain/errors/macro-validation.error";
import { InvalidIndicatorCodeError } from "@/modules/macro/domain/errors/invalid-indicator-code.error";
import { InvalidPeriodDateError } from "@/modules/macro/domain/errors/invalid-period-date.error";
import { InvalidCountryIso3Error } from "@/modules/shared/domain/errors/country.error";

const range = { from: t.Optional(t.String({ maxLength: 10 })), to: t.Optional(t.String({ maxLength: 10 })) };

export function createMacroRoutes(macro: MacroUseCases) {
  return new Elysia({ prefix: "/macro" })
    .onError(({ error, code, set }) => {
      if (error instanceof MacroValidationError || error instanceof InvalidCountryIso3Error || error instanceof InvalidIndicatorCodeError || error instanceof InvalidPeriodDateError) {
        set.status = 400;
        return { error: error.message };
      }
      if (code === "VALIDATION") {
        set.status = 400;
        return { error: "Invalid request parameters" };
      }
      if (code === "NOT_FOUND") return;
      console.error("Macro API request failed", { code, error: error instanceof Error ? error.message : String(error) });
      set.status = 500;
      return { error: "Internal server error" };
    })
    .get("/countries", () => macro.countries())
    .get("/indicators", ({ query }) => macro.indicators(query.category), { query: t.Object({ category: t.Optional(t.String({ maxLength: 30 })) }) })
    .get("/series/:country/:indicator", async ({ params, query, set }) => {
      const result = await macro.getSeries({ country: params.country, indicator: params.indicator, ...query });
      if (!result) { set.status = 404; return { error: "No redistributable series found" }; }
      return result;
    }, { params: t.Object({ country: t.String({ maxLength: 3 }), indicator: t.String({ maxLength: 80 }) }), query: t.Object({ ...range, feature: t.Optional(t.String({ maxLength: 80 })), asOf: t.Optional(t.String({ maxLength: 10 })) }) })
    .get("/overview/:country", ({ params }) => macro.overview(params.country), { params: t.Object({ country: t.String({ maxLength: 3 }) }) })
    .get("/compare", async ({ query, set }) => {
      const result = await macro.compare(query.indicator, query.countries.split(","), query.from, query.to);
      if (!result) { set.status = 404; return { error: "No comparable redistributable data for every requested country" }; }
      return result;
    }, { query: t.Object({ ...range, indicator: t.String({ maxLength: 80 }), countries: t.String({ maxLength: 79 }) }) })
    .get("/calendar", ({ query }) => macro.calendar(query.from, query.to, query.country), { query: t.Object({ from: t.String({ maxLength: 10 }), to: t.String({ maxLength: 10 }), country: t.Optional(t.String({ maxLength: 3 })) }) });
}
