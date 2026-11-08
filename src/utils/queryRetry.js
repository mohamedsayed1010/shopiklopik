/**
 * Retry policy for optional reads whose 4xx answers are final.
 *
 * A 404 from `/api/advertisements/{id}/actions` on a listing still under
 * review, say, is the server's answer and will be the same a second later —
 * retrying it only doubles the failed request. A dropped connection or a 5xx
 * is worth one more try. 408 (timeout) and 429 (rate limited) are the two 4xx
 * that say "not now" rather than "no", so they keep their one retry.
 */
const TRANSIENT_CLIENT_ERRORS = new Set([408, 429]);

export function isPermanentClientError(error) {
  const status = Number(error?.response?.status);

  return status >= 400 && status < 500 && !TRANSIENT_CLIENT_ERRORS.has(status);
}

/** For `useQuery({ retry })`: never on a final 4xx, otherwise up to `max`. */
export function retryUnlessClientError(max = 1) {
  return (failureCount, error) =>
    !isPermanentClientError(error) && failureCount < max;
}
