import { useState } from "react";
import { Download, ExternalLink, ImageOff, Receipt } from "lucide-react";

import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Spinner from "../../../../components/ui/Spinner";
import {
  useAdPaymentScreenshot,
  useObjectUrlRef,
} from "../../../../hooks/admin/useAdminAdPayment";
import {
  adPaymentErrorCopy,
  hasScreenshot,
  screenshotFileName,
} from "../../../../utils/adPayment";

function BlobImage({ blob }) {
  const ref = useObjectUrlRef(blob, "src");

  return (
    <img
      ref={ref}
      alt="صورة إيصال التحويل"
      className="mx-auto max-h-[65vh] w-auto rounded-xl object-contain"
    />
  );
}

function BlobLink({ blob, download, children }) {
  const ref = useObjectUrlRef(blob, "href");

  return (
    <a
      ref={ref}
      target={download ? undefined : "_blank"}
      rel="noreferrer"
      download={download}
      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition-colors duration-200 hover:text-brand-950"
    >
      {children}
    </a>
  );
}

function Preview({ query }) {
  if (query.isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-muted">
        <Spinner />
        <span className="ms-2 text-sm">جارٍ تحميل الإيصال…</span>
      </div>
    );
  }

  if (query.isError) {
    const copy = adPaymentErrorCopy(query.error, { subject: "إيصالات الدفع" });

    return (
      <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 text-center">
        <ImageOff size={26} strokeWidth={1.6} className="text-brand-300" aria-hidden="true" />
        <p className="text-[15px] font-semibold text-ink">
          {copy.status === 404 ? "الإيصال غير متاح" : copy.title}
        </p>
        <p className="max-w-sm text-sm leading-6 text-muted">{copy.description}</p>
        {copy.status !== 404 && copy.status !== 403 && (
          <Button variant="outline" size="sm" onClick={() => query.refetch()} className="mt-2">
            إعادة المحاولة
          </Button>
        )}
      </div>
    );
  }

  return query.data ? <BlobImage blob={query.data} /> : null;
}

/* The receipt, fetched with the admin's token from
   `GET /submissions/{id}/screenshot` and shown from temporary object URLs.
   Nothing is fetched until the dialog opens; the URLs are revoked when it
   closes. `screenshotUrl` only says whether there is one; it is never loaded. */
function ScreenshotDialog({ id, onClose }) {
  const query = useAdPaymentScreenshot({ id });

  return (
    <Modal
      open
      onClose={onClose}
      title="صورة إيصال التحويل"
      size="lg"
      footer={
        query.data ? (
          <div className="flex flex-wrap items-center gap-4">
            <BlobLink blob={query.data}>
              <ExternalLink size={15} aria-hidden="true" />
              فتح في تبويب جديد
            </BlobLink>

            <BlobLink blob={query.data} download={screenshotFileName(id, query.data.type)}>
              <Download size={15} aria-hidden="true" />
              تنزيل الصورة
            </BlobLink>
          </div>
        ) : null
      }
    >
      <Preview query={query} />
    </Modal>
  );
}

/* `onOpenChange` lets the sheet underneath hold its own Escape while this
   dialog is on top: Modal does not stack, so both would close at once. */
export default function AdPaymentScreenshot({ submission, onOpenChange }) {
  const [open, setOpenState] = useState(false);

  const setOpen = (value) => {
    setOpenState(value);

    onOpenChange?.(value);
  };

  if (!hasScreenshot(submission)) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <ImageOff size={16} aria-hidden="true" />
        لا يوجد إيصال مرفق بهذا الطلب.
      </p>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Receipt size={15} />
        عرض الإيصال
      </Button>

      {open && <ScreenshotDialog id={submission.paymentSubmissionId} onClose={() => setOpen(false)} />}
    </>
  );
}
