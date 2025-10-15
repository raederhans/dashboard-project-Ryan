const BACKOFF_DELAYS_MS = [1000, 2000];

/**
 * Fetch JSON with timeout and retry backoff.
 * @template T
 * @param {string} url - Request URL.
 * @param {RequestInit & {timeoutMs?:number, retries?:number}} [options] - Optional settings.
 * @returns {Promise<T>} Resolves with parsed JSON payload.
 * @throws {Error} When all attempts fail or response is not ok.
 */
export async function fetchJson(
  url,
  { timeoutMs = 15000, retries = 2, ...fetchOptions } = {}
) {
  if (!url) {
    throw new Error("fetchJson requires a URL.");
  }

  let attempt = 0;
  // inclusive of initial attempt, so retries=2 results in 3 total attempts
  const totalAttempts = Math.max(0, retries) + 1;

  while (attempt < totalAttempts) {
    const controller = new AbortController();
    const timer =
      timeoutMs > 0
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `fetchJson(${url}) failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = attempt === totalAttempts - 1;
      if (isLastAttempt || error.name === "AbortError") {
        throw error;
      }

      const backoffIndex = Math.min(
        attempt,
        BACKOFF_DELAYS_MS.length - 1
      );
      const delay = BACKOFF_DELAYS_MS[backoffIndex];
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
      attempt += 1;
    }
  }

  throw new Error(`fetchJson(${url}) exhausted retries without success.`);
}

/**
 * Convenience wrapper to retrieve GeoJSON payloads.
 * @template T
 * @param {string} url - GeoJSON endpoint URL.
 * @param {object} [options] - Additional fetch options.
 * @returns {Promise<T>} Resolves with GeoJSON data.
 */
export async function fetchGeoJson(url, options) {
  return fetchJson(url, options);
}
