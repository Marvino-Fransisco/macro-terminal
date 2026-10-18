export interface HttpClientOptions {
  minIntervalMs?: number;
  timeoutMs?: number;
  retries?: number;
  fetch?: (input: URL, init: RequestInit) => Promise<Response>;
  sleep?: (ms: number) => Promise<void>;
}

export function createProviderHttpClient(options: HttpClientOptions = {}) {
  const request = options.fetch ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let tail: Promise<unknown> = Promise.resolve();
  let lastRequest = 0;
  const interval = options.minIntervalMs ?? 1000;

  return {
    async json(url: URL): Promise<unknown> {
      const operation = tail.then(async () => {
        for (let attempt = 0; attempt <= (options.retries ?? 4); attempt++) {
          await sleep(Math.max(0, lastRequest + interval - Date.now()));

          lastRequest = Date.now();
          let response: Response;
          try {
            response = await request(url, {
              headers: { "User-Agent": "MacroTerminal/1.0", Accept: "application/json" },
              signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
            });
          } catch {
            if (attempt === (options.retries ?? 4)) throw new Error(`Provider transport failed: ${url.hostname}`);
            await sleep(1000 * 2 ** attempt);
            continue;
          }

          if (response.ok) {
            try {
              return await response.json();
            } catch {
              throw new Error(`Provider returned invalid JSON: ${url.hostname}`);
            }
          }

          await response.body?.cancel();
          if ((response.status === 429 || response.status >= 500) && attempt < (options.retries ?? 4)) {
            const header = response.headers.get("retry-after");
            const retryAfter = header ? (/^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 0;
            await sleep(Math.max(1000 * 2 ** attempt, Number.isFinite(retryAfter) ? Math.min(retryAfter, 300_000) : 0));
            continue;
          }

          throw new Error(`Provider HTTP ${response.status}: ${url.hostname}`);
        }

        throw new Error(`Provider retries exhausted: ${url.hostname}`);
      });

      tail = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
}

export type ProviderHttpClient = ReturnType<typeof createProviderHttpClient>;

export function parseProviderNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && (value.trim() === "." || value.trim() === "")) return undefined;
  if (typeof value !== "number" && typeof value !== "string") throw new Error("Provider value is not numeric");

  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("Provider value is not finite");

  return number;
}
