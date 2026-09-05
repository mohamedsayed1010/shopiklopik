import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function useAdminReportDeepLink({ reports, isSettled, openReport }) {
  const { id } = useParams();

  const navigate = useNavigate();

  /** The loaded row this address names, if the list is holding it. */
  const match = useMemo(() => {
    if (!id) return null;

    return (
      (reports ?? []).find((report) => String(report?.id) === String(id)) ?? null
    );
  }, [id, reports]);

  /* Opened once per address. The drawer is ordinary state after that — closing
     it must not fight the URL that opened it, and arriving at the same link
     again is the reader asking for it again. */
  const opened = useRef(null);

  useEffect(() => {
    if (!match) return;

    if (opened.current === match.id) return;

    opened.current = match.id;

    openReport(match);
  }, [match, openReport]);

  const clearDeepLink = useMemo(() => {
    if (!id) return null;

    return () =>
      navigate(
        { pathname: "/admin/reports", search: window.location.search },
        { replace: true }
      );
  }, [id, navigate]);

  return {
    /** The address names a report, and the loaded page does not contain it. */
    isMissing: Boolean(id) && isSettled && !match,
    reportId: id ?? null,
    clearDeepLink,
  };
}
