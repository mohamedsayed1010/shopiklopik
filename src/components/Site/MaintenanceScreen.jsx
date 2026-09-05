import Seo from "../Seo";
import { Wrench } from "lucide-react";

export default function MaintenanceScreen({ message }) {
  return (
    <>
      {/* Never indexable: a crawler catching this temporary state would cache
          "under maintenance" as what the site is. */}
      <Seo title="الموقع تحت الصيانة" robots="noindex, nofollow" />

      <div className="mx-auto flex max-w-[640px] flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:py-28">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200">
          <Wrench size={30} strokeWidth={1.7} aria-hidden="true" />
        </span>

        <h1 className="mt-6 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          الموقع تحت الصيانة
        </h1>

        <p className="mt-3 max-w-md text-sm leading-7 text-muted sm:text-[15px]">
          {message || "نجري بعض التحديثات حاليًا. نعتذر عن الإزعاج، وسنعود قريبًا."}
        </p>
      </div>
    </>
  );
}
