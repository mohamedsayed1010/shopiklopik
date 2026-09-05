import { useCallback, useEffect, useState } from "react";

import {
  applyTheme,
  currentTheme,
  readPreference,
  resolveTheme,
  THEMES,
  writePreference,
} from "../utils/theme";

export default function useTheme() {
  const [preference, setPreference] = useState(readPreference);

  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    if (preference !== THEMES.system || !window.matchMedia) return undefined;

    const query = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      const next = resolveTheme(THEMES.system);

      applyTheme(next);

      setTheme(next);
    };

    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, [preference]);

  /** Choose `light`, `dark`, or `system`. */
  const choose = useCallback((next) => {
    const resolved = resolveTheme(next);

    applyTheme(resolved);

    writePreference(next);

    setPreference(next);

    setTheme(resolved);
  }, []);

  const toggle = useCallback(
    () => choose(currentTheme() === THEMES.dark ? THEMES.light : THEMES.dark),
    [choose]
  );

  return { theme, preference, choose, toggle, isDark: theme === THEMES.dark };
}
