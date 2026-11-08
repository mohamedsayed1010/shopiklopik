/* Lets `node --test` load the app's source, which Vite resolves without file
   extensions (`./apiErrors`). A relative specifier with no extension is tried
   as `.js`, `.jsx`, then `/index.js`. Used only by `npm test`. */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANDIDATES = [".js", ".jsx", "/index.js"];

export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");

  if (relative && context.parentURL && !/\.[cm]?jsx?$|\.json$/.test(specifier)) {
    for (const suffix of CANDIDATES) {
      const url = new URL(specifier + suffix, context.parentURL);

      if (existsSync(fileURLToPath(url))) return asModule(await nextResolve(url.href, context));
    }
  }

  return asModule(await nextResolve(specifier, context));
}

/* Node has no format for `.jsx`, and refuses it before a `mock.module()` stub
   can stand in — so a test could never stub a context or component file. Named
   an ES module here, a stubbed `.jsx` loads; an unstubbed one still fails, now
   on its JSX syntax, exactly as it could never load before. */
function asModule(result) {
  return result?.url?.endsWith(".jsx") ? { ...result, format: "module" } : result;
}
