/**
 * One `<script type="application/ld+json">` block.
 *
 * Rendered as a sibling of `<Seo>` rather than inside it. `<Seo>` puts its
 * children into `<Helmet>`, and Helmet only accepts the intrinsic head
 * elements as children — a component there breaks its child mapping. JSON-LD
 * is valid anywhere in the document, so the ordinary tree is the safe place
 * for it.
 */

/**
 * Serialised so that listing text can never escape the script element.
 *
 * The payload carries names and section titles that people typed, and a string
 * containing `</script>` would otherwise close the tag and turn the rest of the
 * JSON into markup. Escaping every `<` as its JSON unicode form keeps the
 * document intact and leaves the parsed value identical — `<` reads back
 * as `<`. It also defuses `<!--`, which HTML would treat as a comment.
 */
function serialize(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }) {
  /* A builder returns null when the page lacks the real values a schema needs,
     so an incomplete graph is expected and simply renders nothing. */
  const graph = (Array.isArray(data) ? data : [data]).filter(Boolean);

  if (!graph.length) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serialize(graph.length === 1 ? graph[0] : graph),
      }}
    />
  );
}
