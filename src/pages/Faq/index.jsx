import Seo from "../../components/Seo";
import JsonLd from "../../components/JsonLd";
import PageHeader from "../../components/ui/PageHeader";
import FaqList from "../../components/Site/FaqList";
import { FAQ_DESCRIPTION, FAQ_TITLE } from "../../seo/pageCopy";
import { faqGraph } from "../../seo/structuredData";

/* The questions that used to close the home page. Same entries, same cards,
   at the width they had there; the title and description are the ones
   `scripts/prerender.mjs` writes into the served /faq document. */
export default function FaqPage() {
  return (
    <>
      <Seo title={FAQ_TITLE} description={FAQ_DESCRIPTION} />

      <JsonLd data={faqGraph()} />

      <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader eyebrow="المساعدة" title={FAQ_TITLE} subtitle={FAQ_DESCRIPTION} />

        <div className="mt-7">
          <FaqList />
        </div>
      </div>
    </>
  );
}
