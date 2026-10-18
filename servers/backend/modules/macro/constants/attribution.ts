import type { Provider } from "../domain/value-objects/provider.vo";

export const FRED_NOTICE = "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.";

export function providerAttributions(providers: Provider[], derived = false) {
  const notices = {
    fred: { notice: FRED_NOTICE, termsUrl: "https://fred.stlouisfed.org/docs/api/terms_of_use.html" },
    worldbank: { notice: "Source: The World Bank and its data providers", termsUrl: "https://data.worldbank.org/summary-terms-of-use" },
  };
  return [...new Set(providers)].map((provider) => {
    const attribution = provider === "fred" || provider === "worldbank" ? notices[provider] : { notice: `Source: ${provider}`, termsUrl: null };
    return { provider, ...attribution, changes: derived ? "Derived calculations by Macro Terminal; not an official provider statistic" : "Values unchanged; periods normalized to ISO dates" };
  });
}
