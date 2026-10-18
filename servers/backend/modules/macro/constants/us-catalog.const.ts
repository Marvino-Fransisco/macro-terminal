import { US_CATALOG_GROUPS } from "./us-catalog-groups.const";

export const US_CATALOG = US_CATALOG_GROUPS.flatMap(
  ([category, frequency, entries]) =>
    entries.split(" ").map((entry) => {
      const [code, fredId] = entry.split(":");
      if (!code || !fredId) throw new Error("Invalid US catalog entry");
      return { code, fredId, category, frequency };
    }),
);
