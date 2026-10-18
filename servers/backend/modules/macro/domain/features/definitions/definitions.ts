import type { FeatureDefinition } from "./type";
import { combine, payrollsChange, regime, sahm, spread, taylorRate } from "../composites";
import { difference, yoy } from "../growth";

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { code: "SPREAD_10Y_2Y", inputs: ["YIELD_10Y", "YIELD_2Y"], compute: (i) => spread(i.YIELD_10Y!, i.YIELD_2Y!) },
  { code: "SPREAD_10Y_3M", inputs: ["YIELD_10Y", "YIELD_3M"], compute: (i) => spread(i.YIELD_10Y!, i.YIELD_3M!) },
  { code: "INVERSION_10Y_2Y", inputs: ["SPREAD_10Y_2Y"], compute: (i) => i.SPREAD_10Y_2Y!.map((p) => ({ ...p, value: p.value < 0 ? 1 : 0 })) },
  { code: "REAL_POLICY_RATE", inputs: ["POLICY_RATE", "PCE_PRICE_CORE"], frequencies: { PCE_PRICE_CORE: "monthly" }, compute: (i) => spread(i.POLICY_RATE!, yoy(i.PCE_PRICE_CORE!, "monthly")) },
  { code: "REAL_POLICY_RATE", inputs: ["POLICY_RATE", "CPI_HEADLINE"], frequencies: { CPI_HEADLINE: "monthly" }, compute: (i) => spread(i.POLICY_RATE!, yoy(i.CPI_HEADLINE!, "monthly")) },
  { code: "REAL_WAGE_GROWTH", inputs: ["AVG_HOURLY_EARNINGS", "CPI_HEADLINE"], frequencies: { AVG_HOURLY_EARNINGS: "monthly", CPI_HEADLINE: "monthly" }, compute: (i) => spread(yoy(i.AVG_HOURLY_EARNINGS!, "monthly"), yoy(i.CPI_HEADLINE!, "monthly")) },
  { code: "OUTPUT_GAP", inputs: ["GDP_REAL", "GDP_POTENTIAL"], frequencies: { GDP_REAL: "quarterly", GDP_POTENTIAL: "quarterly" }, compute: (i) => combine([i.GDP_REAL!, i.GDP_POTENTIAL!], ([actual, potential]) => potential === 0 ? undefined : 100 * (actual! / potential! - 1)) },
  { code: "TAYLOR_RATE", inputs: ["PCE_PRICE_CORE", "OUTPUT_GAP"], frequencies: { PCE_PRICE_CORE: "monthly" }, compute: (i) => combine([yoy(i.PCE_PRICE_CORE!, "monthly"), i.OUTPUT_GAP!], ([inflation, gap]) => taylorRate(inflation!, gap!)) },
  { code: "TAYLOR_GAP", inputs: ["POLICY_RATE", "TAYLOR_RATE"], compute: (i) => spread(i.POLICY_RATE!, i.TAYLOR_RATE!) },
  { code: "NET_LIQUIDITY", inputs: ["CENTRAL_BANK_ASSETS", "TREASURY_GENERAL_ACCOUNT", "REVERSE_REPO_OVERNIGHT"], compute: (i) => combine([i.CENTRAL_BANK_ASSETS!, i.TREASURY_GENERAL_ACCOUNT!, i.REVERSE_REPO_OVERNIGHT!], ([assets, tga, rrp]) => assets! - tga! - rrp!) },
  { code: "SAHM_RULE", inputs: ["UNEMPLOYMENT_RATE"], frequencies: { UNEMPLOYMENT_RATE: "monthly" }, compute: (i) => sahm(i.UNEMPLOYMENT_RATE!) },
  { code: "SAHM_SIGNAL", inputs: ["SAHM_RULE"], compute: (i) => i.SAHM_RULE!.map((p) => ({ ...p, value: p.value >= 0.5 ? 1 : 0 })) },
  { code: "PAYROLLS_CHANGE_3M_AVG", inputs: ["NONFARM_PAYROLLS"], frequencies: { NONFARM_PAYROLLS: "monthly" }, compute: (i) => payrollsChange(i.NONFARM_PAYROLLS!) },
  { code: "GROWTH_IMPULSE", inputs: ["INDUSTRIAL_PRODUCTION"], frequencies: { INDUSTRIAL_PRODUCTION: "monthly" }, compute: (i) => difference(yoy(i.INDUSTRIAL_PRODUCTION!, "monthly"), "monthly", 3) },
  { code: "INFLATION_IMPULSE", inputs: ["CPI_CORE"], frequencies: { CPI_CORE: "monthly" }, compute: (i) => difference(yoy(i.CPI_CORE!, "monthly"), "monthly", 3) },
  { code: "REGIME", inputs: ["GROWTH_IMPULSE", "INFLATION_IMPULSE"], compute: (i) => combine([i.GROWTH_IMPULSE!, i.INFLATION_IMPULSE!], ([growth, inflation]) => regime(growth!, inflation!)) },
];
