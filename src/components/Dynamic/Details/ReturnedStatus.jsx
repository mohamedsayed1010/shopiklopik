import { useState } from "react";
import { CheckCircle2, PackageCheck } from "lucide-react";

import Panel from "./Panel";
import Button from "../../ui/Button";
import ConfirmDialog from "../../ui/ConfirmDialog";
import useLostFoundReturned, { isReturned } from "../../../hooks/useLostFoundReturned";
import { formatDate } from "../../../utils/format";

export default function ReturnedStatus({ post, detailsEndpoint, isOwner = false }) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { markReturned, isPending } = useLostFoundReturned({
    postId: post?.id,
    detailsEndpoint,
  });

  const returned = isReturned(post);

  if (!returned && !isOwner) return null;

  if (returned) {
    const markedAt = formatDate(post?.updatedAt);

    return (
      <Panel padded={false}>
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">
            <CheckCircle2 size={20} strokeWidth={2.1} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-[15px] font-bold text-ink">تم استرجاع هذه الحاجة</p>

            {markedAt && (
              <p className="mt-0.5 text-[13px] text-muted">بتاريخ {markedAt}</p>
            )}
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-ink">وصلت الحاجة لصاحبها؟</p>

            <p className="mt-0.5 text-[13px] text-muted">
              علّم الإعلان كمسترجَع ليعرف الجميع أن البحث انتهى.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            loading={isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {!isPending && <PackageCheck size={16} />}
            تم الاسترجاع
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={isConfirmOpen}
        /* Significant and one-way, but not destructive — the red treatment
           belongs to deleting a post, not to good news about one. */
        tone="brand"
        title="تأكيد الاسترجاع؟"
        description="سيظهر الإعلان للجميع كمسترجَع، ولا يمكن التراجع عن ذلك."
        confirmLabel="نعم، تم الاسترجاع"
        loading={isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          markReturned(undefined, { onSettled: () => setConfirmOpen(false) })
        }
      />
    </>
  );
}
