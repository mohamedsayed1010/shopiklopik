import { matchRoutes } from "react-router-dom";

let appRoutes = [];

export function registerAppRoutes(routes) {
  appRoutes = Array.isArray(routes) ? routes : [];
}

export function servesPath(pathname) {
  if (!pathname || appRoutes.length === 0) return false;

  const matches = matchRoutes(appRoutes, pathname);

  if (!matches || matches.length === 0) return false;

  return matches[matches.length - 1].route?.path !== "*";
}

export default servesPath;
