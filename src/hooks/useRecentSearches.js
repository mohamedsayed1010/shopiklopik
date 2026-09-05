import { useSyncExternalStore } from "react";

const STORAGE_KEY = "shobiklobik:recent-searches";

const LIMIT = 6;

const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

let snapshot = typeof window === "undefined" ? [] : readStorage();

function publish(next) {
  snapshot = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Quota or private mode — this session still works. */
  }

  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return [];
}

export function rememberSearch(term, to = null) {
  const text = String(term ?? "").trim();

  if (text.length < 2) return;

  publish(
    [
      { term: text, to },
      ...snapshot.filter((entry) => entry.term !== text),
    ].slice(0, LIMIT)
  );
}

export function forgetSearch(term) {
  publish(snapshot.filter((entry) => entry.term !== term));
}

export function clearSearches() {
  publish([]);
}

export default function useRecentSearches() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    items,
    remember: rememberSearch,
    forget: forgetSearch,
    clear: clearSearches,
  };
}
