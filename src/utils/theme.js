
export const THEME_STORAGE_KEY = "shobik-theme";

export const THEMES = { light: "light", dark: "dark", system: "system" };

/** The two themes a user can actually be shown. */
const RESOLVED = new Set([THEMES.light, THEMES.dark]);

/** Every value the preference may hold, including "follow the OS". */
const PREFERENCES = new Set([...RESOLVED, THEMES.system]);

export function readPreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return PREFERENCES.has(stored) ? stored : THEMES.system;
  } catch {
    return THEMES.system;
  }
}

export function writePreference(preference) {
  try {
    if (preference === THEMES.system) {
      localStorage.removeItem(THEME_STORAGE_KEY);

      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* Unwritable storage costs the user persistence, not the current session:
       the attribute is already applied and the page is already correct. */
  }
}

/** What the operating system is asking for right now. */
export function systemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return THEMES.light;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.dark
    : THEMES.light;
}

/** A preference plus the environment, reduced to the theme actually shown. */
export function resolveTheme(preference) {
  return preference === THEMES.dark || preference === THEMES.light
    ? preference
    : systemTheme();
}

export function applyTheme(theme) {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');

  /* The navy chrome in light, the canvas in dark — in both cases the colour
     the top of the page actually is. */
  if (meta) meta.setAttribute("content", theme === THEMES.dark ? "#10151d" : "#041b3d");
}

/** The theme currently on the document, for reading back without guessing. */
export function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === THEMES.dark
    ? THEMES.dark
    : THEMES.light;
}
