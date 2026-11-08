/** Clipboard API is https-only and may be refused; the textarea trick covers the rest. */
export async function writeToClipboard(text, { nav = globalThis.navigator, doc = globalThis.document } = {}) {
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);

      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    if (!doc?.createElement || !doc?.body) return false;

    const field = doc.createElement("textarea");

    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";

    doc.body.appendChild(field);
    field.select();

    const copied = doc.execCommand("copy");

    doc.body.removeChild(field);

    return Boolean(copied);
  } catch {
    return false;
  }
}

export default writeToClipboard;
