import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toKebab } from "../../../components/Notifications/notificationTarget";

export default function useAdminAdDeepLink({ modules, openDetails }) {
  const { type: typeParam, id } = useParams();

  const navigate = useNavigate();

  /** The `ListingModuleType` this link names, or null while it cannot be known. */
  const typeId = useMemo(() => {
    if (!typeParam) return null;

    // Already the enum value.
    if (/^\d+$/.test(typeParam)) return Number(typeParam);

    if (!modules?.length) return null;

    const wanted = toKebab(typeParam);

    const match = modules.find(
      (module) =>
        toKebab(module?.name) === wanted || toKebab(module?.arabicName) === wanted
    );

    return match?.id ?? null;
  }, [typeParam, modules]);

  /* Opened once per address. The sheet is ordinary state after that — closing
     it must not fight the URL that opened it, and re-opening the same link is
     the reader asking for it again. */
  const opened = useRef(null);

  useEffect(() => {
    if (!id || typeId === null) return;

    const address = `${typeId}/${id}`;

    if (opened.current === address) return;

    opened.current = address;

    openDetails({ typeId, id, title: null });
  }, [id, typeId, openDetails]);

  const clearDeepLink = useMemo(() => {
    if (!id) return null;

    return () =>
      navigate(
        { pathname: "/admin/ads", search: window.location.search },
        { replace: true }
      );
  }, [id, navigate]);

  return {
    /** True while the address names a record whose module could not be resolved. */
    isUnresolved: Boolean(id && typeParam && typeId === null && modules?.length > 0),
    clearDeepLink,
  };
}
