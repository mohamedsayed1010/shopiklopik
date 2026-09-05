
/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

const isFilled = (value) => typeof value === "string" && value.trim() !== "";

function payloadOf(error) {
  if (!error || typeof error !== "object") return null;

  if (error.response) return error.response.data ?? null;

  if (error.isAxiosError || error instanceof Error) return null;

  return "errors" in error || "success" in error ? error : null;
}

function readErrors(payload) {
  const raw = payload?.errors;

  if (Array.isArray(raw)) {
    return raw.filter(isFilled).map((text) => ({ text, field: null }));
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw).flatMap(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [messages];

      /* A key of "" or "$" is ModelState's way of saying "the request as a
         whole", not a field — it must not be treated as one. */
      const named = isFilled(field) && field !== "$" ? field : null;

      return list.filter(isFilled).map((text) => ({ text, field: named }));
    });
  }

  return [];
}

/** Collapse whitespace so two spellings of one sentence dedupe as one. */
const dedupeKey = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

export function apiErrorEntries(error, fallback = null) {
  const payload = payloadOf(error);

  const entries = readErrors(payload);

  /* `message` is a headline, not a finding: it is only worth showing when
     `errors` said nothing, because otherwise it is the "One or more validation
     errors occurred." wrapper around sentences already listed. */
  if (entries.length === 0 && isFilled(payload?.message)) {
    entries.push({ text: payload.message.trim(), field: null });
  }

  /* No body at all — a network failure, a CORS rejection, a timeout. Axios's
     own `error.message` ("Network Error") is developer text, so the caller's
     fallback speaks instead. */
  if (entries.length === 0 && isFilled(fallback)) {
    entries.push({ text: fallback.trim(), field: null });
  }

  const seen = new Set();

  return entries.filter((entry) => {
    const key = dedupeKey(entry.text);

    if (!key || seen.has(key)) return false;

    seen.add(key);

    return true;
  });
}

/** The same messages as plain strings. */
export function apiErrorMessages(error, fallback = null) {
  return apiErrorEntries(error, fallback).map((entry) => entry.text);
}

export function apiErrorText(error, fallback = "") {
  const [first] = apiErrorMessages(error, fallback);

  return first ?? fallback;
}

/* ------------------------------------------------------------------ */
/* Field matching                                                      */
/* ------------------------------------------------------------------ */

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `SubCategoryId` → ["sub","category","id"]; `confirm_password` → [...]. */
function wordsOf(name) {
  return normalize(
    String(name ?? "")
      .replace(/([a-z\d])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
  )
    .split(" ")
    .filter(Boolean);
}

const STRUCTURAL = new Set(["id", "ids", "guid", "url", "urls", "uri"]);

/** Below this an "alias" is a fragment, not a name. */
const MIN_ALIAS = 3;

export function fieldAliases(field) {
  const descriptor =
    typeof field === "string" ? { name: field } : (field ?? {});

  const aliases = new Set();

  const add = (phrase) => {
    const value = normalize(phrase);

    if (value.length >= MIN_ALIAS) aliases.add(value);
  };

  const words = wordsOf(descriptor.name);

  if (words.length > 0) {
    add(words.join(" "));

    /* `SubCategoryId` is spoken about as "sub category" — the suffix is how the
       column is stored, not how anyone refers to it. */
    const trimmed = words.filter(
      (word, index) => !(index === words.length - 1 && STRUCTURAL.has(word))
    );

    if (trimmed.length > 0) add(trimmed.join(" "));
  }

  // Whatever the config calls it, in either language it publishes.
  [descriptor.labelEn, descriptor.label, descriptor.title].forEach(add);

  /* An alias made only of structural tokens names nothing. */
  return [...aliases].filter(
    (alias) => !alias.split(" ").every((word) => STRUCTURAL.has(word))
  );
}

function occurrences(text, alias) {
  const haystack = ` ${text} `;

  const needle = ` ${alias} `;

  const spans = [];

  let from = 0;

  for (;;) {
    const at = haystack.indexOf(needle, from);

    if (at === -1) break;

    spans.push({ start: at, end: at + needle.length });

    // Overlapping occurrences count: "name name" is two, not one.
    from = at + 1;
  }

  return spans;
}

export function matchField(message, fields = []) {
  const text = normalize(message);

  if (!text) return null;

  const hits = [];

  fields.forEach((field) => {
    const name = typeof field === "string" ? field : field?.name;

    if (!name) return;

    fieldAliases(field).forEach((alias) => {
      occurrences(text, alias).forEach((span) => {
        hits.push({ name, ...span, length: span.end - span.start });
      });
    });
  });

  if (hits.length === 0) return null;

  /* Rule 1: an occurrence swallowed whole by a longer one belonging to another
     field is that longer name being read, not this one. */
  const standing = hits.filter(
    (hit) =>
      !hits.some(
        (other) =>
          other.name !== hit.name &&
          other.length > hit.length &&
          other.start <= hit.start &&
          other.end >= hit.end
      )
  );

  const names = new Set(standing.map((hit) => hit.name));

  // Rule 2: exactly one field, or none at all.
  return names.size === 1 ? [...names][0] : null;
}

export function mapApiErrors(error, { fields = [], fallback = null } = {}) {
  const entries = apiErrorEntries(error, fallback);

  const fieldErrors = {};

  const globalErrors = [];

  const known = new Set(
    fields
      .map((field) => (typeof field === "string" ? field : field?.name))
      .filter(Boolean)
  );

  entries.forEach((entry) => {
    /* A field the payload named itself is taken at its word — but only when the
       form actually renders it, so a server-side key for a hidden control still
       reaches the reader through the summary. */
    const stated = entry.field && known.has(entry.field) ? entry.field : null;

    const target = stated ?? matchField(entry.text, fields);

    if (target) {
      (fieldErrors[target] ??= []).push(entry.text);

      return;
    }

    globalErrors.push(entry.text);
  });

  return {
    fieldErrors,
    globalErrors,
    messages: entries.map((entry) => entry.text),
  };
}

export function joinFieldErrors(fieldErrors = {}) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([name, messages]) => [
      name,
      messages.join(" • "),
    ])
  );
}
