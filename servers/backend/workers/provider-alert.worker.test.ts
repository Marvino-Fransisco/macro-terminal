import { expect, test } from "bun:test";
import { createProviderAlertWorker } from "./provider-alert.worker";

test("provider failure alerts deduplicate until recovery", async () => {
  let failures = [{ provider: "fred", seriesId: "x", consecutiveFailures: 3 }];
  const notifications: unknown[] = [];
  const tick = createProviderAlertWorker({ async providerFailures() { return failures; } }, (event) => { notifications.push(event); });
  await tick();
  await tick();
  expect(notifications.length).toBe(1);
  failures = [];
  await tick();
  failures = [{ provider: "fred", seriesId: "x", consecutiveFailures: 3 }];
  await tick();
  expect(notifications.length).toBe(2);
});
