import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function useAdminRecordDeepLink({ listPath, open }) {
  const { id } = useParams();

  const navigate = useNavigate();

  /* Opened once per address. The sheet is ordinary state after that — closing
     it must not fight the URL that opened it, and arriving at the same link
     again is the reader asking for it again. */
  const opened = useRef(null);

  useEffect(() => {
    if (!id) return;

    if (opened.current === id) return;

    opened.current = id;

    open(id);
  }, [id, open]);

  const clearDeepLink = useMemo(() => {
    if (!id) return null;

    return () =>
      navigate(
        { pathname: listPath, search: window.location.search },
        { replace: true }
      );
  }, [id, listPath, navigate]);

  return { recordId: id ?? null, clearDeepLink };
}
