import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

import useGoogleAuthConfig from "./useGoogleAuthConfig";
import useGoogleSignIn from "./useGoogleSignIn";
import { loadGoogleIdentity } from "../../utils/googleIdentity";
import useElementWidth from "../../hooks/useElementWidth";
import Spinner from "../ui/Spinner";

/* Google renders its own control, and it is the only one that can hand back an
   ID token: the widget owns the account chooser and the token it produces. What
   is ours is the frame around it — the width it is told to fill, and the states
   drawn over it. `width` is a number of pixels to Google, clamped to the range
   the widget accepts. */
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/** Same voice as the field errors on this screen: stated, not decorated. */
function Notice({ children, onRetry }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] leading-6 text-muted"
    >
      <AlertCircle
        size={16}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-red-500"
      />

      <span className="flex-1">{children}</span>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex shrink-0 cursor-pointer items-center gap-1 font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
        >
          <RotateCw size={13} aria-hidden="true" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export default function GoogleSignIn() {
  const { enabled, clientId, isLoading, isError, refetch } =
    useGoogleAuthConfig();

  const { signIn, isPending } = useGoogleSignIn();

  const [frameRef, width] = useElementWidth();

  const buttonRef = useRef(null);

  const [scriptFailed, setScriptFailed] = useState(false);

  /* Read inside Google's callback rather than closed over: the widget is
     rendered once and keeps the callback it was given, so a stale `isPending`
     would let a second click through. */
  const pendingRef = useRef(false);

  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!enabled || !clientId || width === 0) return undefined;

    let cancelled = false;

    loadGoogleIdentity()
      .then((identity) => {
        if (cancelled || !buttonRef.current) return;

        identity.initialize({
          client_id: clientId,

          callback: (response) => {
            // Two clicks, or a chooser answered twice, must not become two
            // sign-ins.
            if (pendingRef.current || !response?.credential) return;

            signIn(response.credential);
          },

          /* A popup, not a redirect: the sign-in screen keeps its state, and
             the app never has to read a token out of its own address bar. */
          ux_mode: "popup",
          context: "signin",
          itp_support: true,
        });

        /* Re-rendered when the frame changes width; the container is emptied
           first so a resize replaces the button instead of stacking another. */
        buttonRef.current.innerHTML = "";

        identity.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: "ar",
          width: Math.round(Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH)),
        });
      })
      .catch(() => {
        if (!cancelled) setScriptFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId, width, signIn]);

  /* Nothing to offer and nothing to apologise for: this deployment has Google
     sign-in switched off. */
  if (!isLoading && !isError && !enabled) return null;

  /* The frame is measured here, on the wrapper, not on the button's own
     container: that container only exists once the config has arrived, and a
     size observer attached before it mounted would never see it. */
  return (
    <div ref={frameRef} className="mt-6 space-y-3">
      {isLoading && (
        <div className="flex h-12 items-center justify-center gap-2.5 rounded-full border border-line bg-canvas text-sm text-muted">
          <Spinner size="sm" className="text-brand-500" />
          جارٍ تحضير الدخول بحساب جوجل...
        </div>
      )}

      {isError && (
        <Notice onRetry={refetch}>
          تعذّر تحميل إعدادات الدخول بحساب جوجل. يمكنك تسجيل الدخول باسم المستخدم
          وكلمة المرور.
        </Notice>
      )}

      {scriptFailed && !isError && (
        <Notice onRetry={() => window.location.reload()}>
          تعذّر تحميل خدمة جوجل. تحقّق من اتصالك أو من مانع الإعلانات، أو سجّل
          الدخول باسم المستخدم وكلمة المرور.
        </Notice>
      )}

      {enabled && !scriptFailed && (
        <div className="relative">
          {/* Google's widget. Held at the height of our own buttons so the two
              read as one stack, and taken out of reach while the exchange with
              the backend is in flight. */}
          <div
            ref={buttonRef}
            aria-busy={isPending || undefined}
            className={`flex min-h-12 justify-center [&_iframe]:!mx-auto ${
              isPending ? "pointer-events-none opacity-40" : ""
            }`}
          />

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full bg-surface/80 text-sm font-medium text-ink">
              <Spinner size="sm" className="text-brand-500" />
              جارٍ تسجيل الدخول بحساب جوجل...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
