
const REPLACEMENTS = {
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
  ة: "ه",
  ى: "ي",
  ئ: "ي",
  ؤ: "و",
};

/** Arabic combining marks (tashkeel) and the tatweel elongation dash. */
const DIACRITIC = /[ً-ْٰـ]/;

/** Latin-Arabic digits fold together so "٢٠٢٤" finds "2024". */
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function fold(value) {
  const source = String(value ?? "");

  let text = "";

  const map = [];

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (DIACRITIC.test(character)) continue;

    const digit = ARABIC_DIGITS.indexOf(character);

    const folded =
      digit >= 0 ? String(digit) : REPLACEMENTS[character] ?? character;

    text += folded.toLowerCase();

    map.push(index);
  }

  return { text, map };
}

/** Folded text only — for building a haystack. */
export function foldText(value) {
  return fold(value).text;
}

export function highlight(value, query) {
  const source = String(value ?? "");

  const needle = foldText(String(query ?? "").trim());

  if (!needle) return [{ text: source, match: false }];

  const { text, map } = fold(source);

  const at = text.indexOf(needle);

  if (at === -1) return [{ text: source, match: false }];

  const start = map[at];

  /* The character *after* the match in the original string: the last folded
     character may have carried diacritics that the fold removed. */
  const end = at + needle.length < map.length ? map[at + needle.length] : source.length;

  return [
    { text: source.slice(0, start), match: false },
    { text: source.slice(start, end), match: true },
    { text: source.slice(end), match: false },
  ].filter((segment) => segment.text.length > 0);
}

export default fold;
