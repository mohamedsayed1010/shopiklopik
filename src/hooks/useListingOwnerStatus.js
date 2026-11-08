import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";
import { useAdPaymentStatus } from "./useAdPayment";
import { resolveListingOwnership } from "../utils/listingOwnership";
import { interactionPolicy, moderationFromStatus } from "../utils/listingModeration";

/**
 * The signed-in reader's relation to the listing on screen, and its moderation
 * status when they own it — see `utils/listingModeration` for where the status
 * comes from and why.
 *
 * `paymentLookup` is the create-ad-form's `payment` block (it names the
 * status endpoint and the module's advertisement type). Same query key as the
 * ad payment page, so the two share one request and one cache entry.
 */
export default function useListingOwnerStatus({ record, paymentLookup, moduleType = null }) {
  const { user } = useContext(AuthContext);

  const { isOwner: isOwnerByRecord } = resolveListingOwnership({
    actions: null,
    record,
    userId: user?.id,
  });

  const advertisementType = paymentLookup?.advertisementType ?? moduleType ?? null;

  const statusEndpoint = paymentLookup?.statusEndpoint ?? null;

  const canAsk = Boolean(isOwnerByRecord && statusEndpoint && advertisementType && record?.id);

  const statusQuery = useAdPaymentStatus({
    statusEndpoint,
    advertisementType,
    advertisementId: record?.id,
    enabled: canAsk,
  });

  const moderation = moderationFromStatus(statusQuery.data);

  /* Settled: answered, refused, or never going to be asked. */
  const statusSettled = !canAsk || statusQuery.isSuccess || statusQuery.isError;

  return {
    isOwnerByRecord,
    moderation,
    statusSettled,
    ...interactionPolicy({
      isOwnerByRecord,
      statusSettled,
      isPending: moderation.isPending,
    }),
  };
}
