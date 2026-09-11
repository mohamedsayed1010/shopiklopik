import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
// Newsletter-only icons, restored with the section below:
// import { Send, ShieldCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import BottomNav from "./BottomNav";
import Logo from "../ui/Logo";
import useSiteSettings from "../../hooks/useSiteSettings";
import { toTelHref } from "../../utils/siteSettings";
import { toWhatsAppHref } from "../../utils/format";

const QUICK_LINKS = [
  { key: "home", to: "/", label: "الرئيسية" },
  // The categories grid lives on the home page under this id.
  { key: "categories", to: "/", hash: "categories", label: "الأقسام" },
  { key: "create", to: "/create-product", label: "أضف إعلانك" },
  { key: "mine", to: "/profile", label: "إعلاناتي" },
  { key: "about", to: "/about", label: "من نحن" },
  // A real destination now, rather than a mailto: the page carries every
  // channel the settings define, not just the address.
  { key: "contact", to: "/contact", label: "تواصل معنا" },
];

/** The two pages whose whole content is a stored settings field, and the
    public account-deletion page the Google Play listing points to. */
const LEGAL_LINKS = [
  { key: "terms", to: "/terms", label: "الشروط والأحكام" },
  { key: "privacy", to: "/privacy", label: "سياسة الخصوصية" },
  { key: "delete-account", to: "/delete-account", label: "حذف الحساب" },
];

const DEVELOPERS = [
  {
    key: "mohamed",
    name: "Mohamed Sayed",
    phone: "01010318747",
    channel: "whatsapp",
  },
  {
    key: "abdullah",
    name: "Abdullah Elbanna",
    phone: "01026568617",
    channel: "whatsapp",
  },
];

const CHANNELS = {
  whatsapp: {
    label: "WhatsApp",
    icon: <FaWhatsapp className="h-3.5 w-3.5 text-[#25D366]" />,
    href: (phone) => toWhatsAppHref(phone),
    /* An external page, so it opens away from the app. */
    external: true,
    describe: (name, phone) =>
      `تواصل مع المطوّر ${name} عبر واتساب على الرقم ${phone}`,
  },
  // phone: {
  //   label: "Phone",
  //   icon: (
  //     <Phone
  //       size={14}
  //       strokeWidth={2.4}
  //       aria-hidden="true"
  //       className="text-gold-300"
  //     />
  //   ),
  //   href: (phone) => toTelHref(phone),
  //   external: false,
  //   describe: (name, phone) =>
  //     `تواصل مع المطوّر ${name} هاتفيًا على الرقم ${phone}`,
  // },
};

/** Section heading plus the gold hairline that anchors it. */
function ColumnTitle({ id, children }) {
  return (
    <>
      <h3 id={id} className="text-sm font-bold tracking-wide text-white">
        {children}
      </h3>

      <span
        aria-hidden="true"
        className="mt-3 block h-px w-10 bg-gradient-to-r from-gold-300 to-transparent"
      />
    </>
  );
}

/** Quick link with an underline that draws itself from the inline start. */
function FooterLink({ link }) {
  const label = (
    <span className="relative">
      {link.label}

      <span
        aria-hidden="true"
        className="absolute -bottom-1 h-px w-0 bg-gradient-to-r from-gold-300 to-gold-600 transition-[width] duration-300 ease-out group-hover/link:w-full start-0"
      />
    </span>
  );

  const className =
    "group/link inline-flex items-center gap-2 py-1 text-sm text-brand-200 transition-colors duration-300 ease-out hover:text-white";

  const marker = (
    <span
      aria-hidden="true"
      className="h-1 w-1 shrink-0 rounded-full bg-brand-400 transition-[background-color,transform] duration-300 ease-out group-hover/link:scale-150 group-hover/link:bg-gold-300"
    />
  );

  // "Contact" resolves to an address, not a route.
  if (link.href) {
    return (
      <a href={link.href} className={className}>
        {marker}
        {label}
      </a>
    );
  }

  return (
    <Link
      to={link.to}
      onClick={(event) => {
        if (!link.hash) return;

        const target = document.getElementById(link.hash);

        // Already on the page that holds the section — scroll instead of
        // re-navigating. Anywhere else, let the router do its job.
        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={className}
    >
      {marker}
      {label}
    </Link>
  );
}

/** Glass disc that adopts its network's colour on hover, with a click ripple. */
function SocialButton({ social, index }) {
  const [ripples, setRipples] = useState([]);

  const { Icon } = social;

  const addRipple = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    setRipples((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
    ]);
  };

  return (
    <li className="group relative">
      {/* Float lives on the wrapper: keyframed transforms would otherwise
          win over the hover scale on the anchor itself. */}
      <span
        className="block animate-float-soft"
        style={{ animationDelay: `${index * 0.45}s` }}
      >
        <a
          href={social.href}
          aria-label={social.label}
          target="_blank"
          rel="noreferrer"
          onPointerDown={addRipple}
          className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-white/75 shadow-lg backdrop-blur-md transition-[transform,color,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:scale-110 hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950 active:scale-95 sm:h-12 sm:w-12"
        >
          {/* Brand fill and halo, revealed together on intent. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={{ background: social.background }}
          />

          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={{ boxShadow: `0 10px 30px -6px ${social.glow}` }}
          />

          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              aria-hidden="true"
              onAnimationEnd={() =>
                setRipples((current) =>
                  current.filter((item) => item.id !== ripple.id)
                )
              }
              className="pointer-events-none absolute h-10 w-10 animate-ripple rounded-full bg-white/60"
              style={{ left: ripple.x - 20, top: ripple.y - 20 }}
            />
          ))}

          <Icon className="relative h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      </span>

      {/* Purely visual: the anchor already carries the same text as its
          aria-label, so exposing this too would read the network twice. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-lg border border-white/10 bg-brand-950/95 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg backdrop-blur-md transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        {social.label}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Newsletter — commented out, not deleted.
//
// The section is hidden from the UI; the code below is kept verbatim so it can
// be restored by un-commenting this block, the render site in `Footer`, and the
// two icon imports at the top of the file.
// ---------------------------------------------------------------------------
// /**
//  * Newsletter.
//  *
//  * The API publishes no subscription endpoint — there is nothing under
//  * `/api/**` that accepts an address — so this deliberately does **not** post
//  * anywhere and does **not** claim a subscription was created. The submit is a
//  * real `mailto:` addressed to support with the typed address in the body,
//  * which works today and needs no backend. The moment an endpoint exists, the
//  * anchor becomes a form submit and nothing else here changes.
//  */
// function Newsletter({ supportEmail }) {
//   const [email, setEmail] = useState("");
//
//   /* Without a configured support address there is nowhere to send this, so the
//      subscribe affordance stays inert rather than opening an empty `mailto:`. */
//   const isValid =
//     Boolean(supportEmail) &&
//     /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
//
//   const mailtoHref = useMemo(() => {
//     const subject = encodeURIComponent("اشتراك في النشرة البريدية");
//
//     const body = encodeURIComponent(
//       `أرغب في الاشتراك في النشرة البريدية.\nالبريد الإلكتروني: ${email.trim()}`
//     );
//
//     // The support address is the settings' own, so changing it in the admin
//     // screen re-points this without touching the footer.
//     return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
//   }, [email, supportEmail]);
//
//   return (
//     <section
//       aria-labelledby="footer-newsletter"
//       className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-xl backdrop-blur-xl sm:p-8"
//     >
//       {/* Gold wash in the inline-start corner, so the panel reads as lit
//           rather than flat. */}
//       <span
//         aria-hidden="true"
//         className="pointer-events-none absolute -top-24 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl start-[-3rem]"
//       />
//
//       <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
//         <div className="max-w-md">
//           <h3
//             id="footer-newsletter"
//             className="text-lg font-bold text-white sm:text-xl"
//           >
//             النشرة البريدية
//           </h3>
//
//           <p className="mt-2 text-sm leading-7 text-brand-200">
//             اشترك ليصلك أحدث الإعلانات والعروض في الفيوم أولًا بأول.
//           </p>
//         </div>
//
//         <div className="w-full lg:max-w-md">
//           <div className="flex flex-col gap-3 sm:flex-row">
//             <div className="relative flex-1">
//               <Mail
//                 size={17}
//                 aria-hidden="true"
//                 className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-brand-300 start-4"
//               />
//
//               <input
//                 type="email"
//                 inputMode="email"
//                 dir="ltr"
//                 value={email}
//                 onChange={(event) => setEmail(event.target.value)}
//                 placeholder="you@example.com"
//                 aria-label="البريد الإلكتروني"
//                 className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] text-[15px] text-white outline-none backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-300 ease-out placeholder:text-brand-300/60 hover:border-white/25 focus:border-gold-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-gold-300/15 ps-11 pe-4"
//               />
//             </div>
//
//             {/* Anchor, not a button: with no endpoint to post to, the honest
//                 affordance is one that actually goes somewhere. */}
//             <a
//               href={isValid ? mailtoHref : undefined}
//               aria-disabled={!isValid || undefined}
//               onClick={(event) => {
//                 if (!isValid) event.preventDefault();
//               }}
//               className={`group/subscribe inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-bold transition-[transform,box-shadow,background-color,opacity] duration-300 ease-out ${
//                 isValid
//                   ? "cursor-pointer bg-gradient-to-r from-gold-300 to-gold-400 text-brand-900 shadow-lg shadow-gold-400/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold-400/30 active:translate-y-0 active:scale-[.98]"
//                   : "cursor-not-allowed bg-white/10 text-brand-300"
//               }`}
//             >
//               اشترك
//               {/* Mirrored so the paper plane points along the text. */}
//               <Send
//                 size={16}
//                 aria-hidden="true"
//                 className="transition-transform duration-300 ease-out rtl:-scale-x-100 group-hover/subscribe:-translate-y-0.5"
//               />
//             </a>
//           </div>
//
//           <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-5 text-brand-300">
//             <ShieldCheck size={13} aria-hidden="true" className="shrink-0" />
//             لن نشارك بريدك مع أي طرف آخر.
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// }

function DeveloperSignature({ name, phone, channel }) {
  const { label, icon, href, external, describe } = CHANNELS[channel];

  return (
    <span className="sig">
      <a
        href={href(phone)}
        {...(external ? { target: "_blank", rel: "noreferrer" } : null)}
        aria-label={describe(name, phone)}
        className="sig__plate"
      >
        <span aria-hidden="true" className="sig__halo" />

        <span className="sig__name">
          {name}
          <span aria-hidden="true" className="sig__underline" />
        </span>
      </a>

      {/* Decorative duplicate of the link's own aria-label. */}
      <span aria-hidden="true" className="sig__tip">
        <span className="sig__tip-label">
          {icon}
          {label}
        </span>

        <span className="sig__tip-value">{phone}</span>

        <span className="sig__arrow" />
      </span>
    </span>
  );
}

export default function Footer() {
  const { settings, socialLinks } = useSiteSettings();

  const contactItems = useMemo(() => {
    const whatsAppHref = toWhatsAppHref(settings.whatsAppNumber);

    /* A channel with nothing behind it is dropped rather than rendered as a
       dead row — which is what the three `href: "#"` social links used to be. */
    return [
      settings.address && {
        key: "address",
        icon: MapPin,
        text: settings.address,
      },
      settings.phoneNumber && {
        key: "phone",
        icon: Phone,
        text: settings.phoneNumber,
        href: toTelHref(settings.phoneNumber),
        ltr: true,
      },
      whatsAppHref && {
        key: "whatsapp",
        icon: FaWhatsapp,
        text: settings.whatsAppNumber,
        href: whatsAppHref,
        external: true,
        ltr: true,
      },
      settings.email && {
        key: "email",
        icon: Mail,
        text: settings.email,
        href: `mailto:${settings.email}`,
        ltr: true,
      },
    ].filter(Boolean);
  }, [settings]);

  return (
    <>
      <footer className="relative isolate overflow-hidden border-t border-white/10 bg-gradient-to-b from-brand-900 via-brand-950 to-[#010b1a]">
        {/* Animated gradient hairline along the top edge. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px animate-border-flow bg-[length:200%_100%] bg-[linear-gradient(90deg,transparent_0%,rgba(245,200,66,.75)_25%,rgba(146,170,204,.6)_50%,rgba(245,200,66,.75)_75%,transparent_100%)]"
        />

        {/* Soft radial wash behind the content. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(75%_100%_at_50%_0%,rgba(91,125,170,.25),transparent_72%)]"
        />

        {/* Two drifting blobs — blurred, low opacity, GPU-friendly transforms. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -z-10 h-72 w-72 animate-blob-drift rounded-full bg-gold-500/10 blur-3xl start-[-5rem]"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -z-10 h-80 w-80 animate-blob-drift rounded-full bg-brand-400/10 blur-3xl [animation-delay:-9s] end-[-6rem]"
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          {/* <Newsletter supportEmail={settings.email} /> */}

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-5">
              <Logo
                size="lg"
                tone="light"
                tagline
                src={settings.logoUrl || undefined}
                name={settings.siteName || undefined}
              />

              <p className="mt-5 max-w-sm text-sm leading-7 text-brand-200">
                {settings.description}
              </p>

              <ul className="mt-7 space-y-3.5 text-sm text-brand-200">
                {contactItems.map((item) => (
                  <li key={item.key} className="group/row flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-brand-300 backdrop-blur-md transition-[color,border-color,transform] duration-300 ease-out group-hover/row:-translate-y-0.5 group-hover/row:border-gold-300/40 group-hover/row:text-gold-300">
                      <item.icon size={15} />
                    </span>

                    {item.href ? (
                      <a
                        href={item.href}
                        dir={item.ltr ? "ltr" : undefined}
                        {...(item.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className={`truncate transition-colors duration-300 ease-out hover:text-gold-300 ${
                          item.ltr ? "tnum" : ""
                        }`}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span className="truncate">{item.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <nav aria-labelledby="footer-links" className="lg:col-span-3">
              <ColumnTitle id="footer-links">روابط سريعة</ColumnTitle>

              <ul className="mt-5 space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.key}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>

            {/* Social */}
            <div className="lg:col-span-4">
              <ColumnTitle>تابعنا</ColumnTitle>

              <p className="mt-4 text-[13px] leading-6 text-brand-300">
                {socialLinks.length
                  ? "كن أول من يعرف بأحدث الإعلانات والعروض."
                  : "لم تُضف حسابات التواصل الاجتماعي بعد."}
              </p>

              {socialLinks.length > 0 && (
                <ul className="mt-6 flex flex-wrap items-center gap-3">
                  {socialLinks.map((social, index) => (
                    <SocialButton
                      key={social.key}
                      social={social}
                      index={index}
                    />
                  ))}
                </ul>
              )}

              {/* The legal pages sit under the follow column rather than in
                  the quick links, so the grid keeps its three-column rhythm. */}
              <ul className="mt-7 space-y-2.5">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.key}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden="true"
            className="mt-14 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,.12)_18%,rgba(245,200,66,.4)_50%,rgba(255,255,255,.12)_82%,transparent_100%)]"
          />

          {/* Latin copy inside an RTL document: pin the direction on the
              copyright so the "©" cannot be reordered by the bidi algorithm.
              The signature pins its own. */}
          <div className="mt-7 flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-start">
            {/* Only when the site actually has a name to put in it — an empty
                setting would otherwise print "© 2026 . All rights reserved." */}
            {(settings.siteNameEn || settings.siteName) && (
              <p dir="ltr" className="text-xs leading-5 text-brand-300">
                © {new Date().getFullYear()}{" "}
                {settings.siteNameEn || settings.siteName}. All rights reserved.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3">
              <span className="text-xs text-brand-300">تطوير</span>

              {DEVELOPERS.map((developer, index) => (
                <Fragment key={developer.key}>
                  {index > 0 && (
                    <span aria-hidden="true" className="text-brand-400">
                      ·
                    </span>
                  )}

                  <DeveloperSignature
                    name={developer.name}
                    phone={developer.phone}
                    channel={developer.channel}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </>
  );
}
