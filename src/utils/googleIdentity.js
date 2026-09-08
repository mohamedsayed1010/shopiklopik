/**
 * Google Identity Services, loaded on demand.
 *
 * Fetched once per page and shared by every caller. It cannot be a tag in
 * `index.html`: the button is rendered against the client id the backend hands
 * out, which is only known at runtime.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";

let pending = null;

function ready() {
  return typeof window !== "undefined" && window.google?.accounts?.id
    ? window.google.accounts.id
    : null;
}

export function loadGoogleIdentity() {
  const loaded = ready();

  if (loaded) return Promise.resolve(loaded);

  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);

    const script = existing ?? document.createElement("script");

    const settle = () => {
      const identity = ready();

      if (identity) resolve(identity);
      else reject(new Error("Google Identity Services loaded without an API"));
    };

    const fail = () => {
      /* A failed load must not be cached as the answer — an ad blocker lifted,
         or a network that came back, deserves a second chance. */
      pending = null;

      reject(new Error("Failed to load Google Identity Services"));
    };

    script.addEventListener("load", settle, { once: true });
    script.addEventListener("error", fail, { once: true });

    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }
  });

  return pending;
}

export default loadGoogleIdentity;
