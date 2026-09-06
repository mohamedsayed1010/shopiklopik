import { serializeGraph } from "../seo/structuredData";

/**
 * One `<script type="application/ld+json">` block.
 *
 * Rendered as a sibling of `<Seo>` rather than inside it. `<Seo>` puts its
 * children into `<Helmet>`, and Helmet only accepts the intrinsic head
 * elements as children — a component there breaks its child mapping. JSON-LD
 * is valid anywhere in the document, so the ordinary tree is the safe place
 * for it.
 *
 * The serialising — including the escaping that stops listing text closing the
 * script tag — lives in `seo/structuredData.js`, because the prerenderer
 * writes the same block into the built HTML and the two must produce identical
 * bytes.
 */
export default function JsonLd({ data }) {
  /* A builder returns null when the page lacks the real values a schema needs,
     so an incomplete graph is expected and simply renders nothing. */
  const json = serializeGraph(data);

  if (!json) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
