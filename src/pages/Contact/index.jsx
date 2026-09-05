import Seo from "../../components/Seo";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import useSiteSettings from "../../hooks/useSiteSettings";
import { toTelHref } from "../../utils/siteSettings";
import { toWhatsAppHref } from "../../utils/format";

/** Latin-script values must not be reordered by the RTL bidi algorithm. */
const LTR = "ltr";

function ChannelCard({ icon: Icon, label, value, href, external, tone }) {
  const body = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${tone}`}
      >
        <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium text-muted">
          {label}
        </span>

        <span
          dir={value.ltr ? LTR : undefined}
          className={`mt-0.5 block truncate text-[15px] font-semibold text-ink ${
            value.ltr ? "tnum" : ""
          }`}
        >
          {value.text}
        </span>
      </span>
    </>
  );

  const shell =
    "flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs";

  if (!href) {
    return <li className={shell}>{body}</li>;
  }

  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={`${shell} h-full transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md`}
      >
        {body}
      </a>
    </li>
  );
}

export default function ContactPage() {
  const { settings, socialLinks, isLoading } = useSiteSettings();

  const siteName = settings.siteName || settings.siteNameEn;

  const whatsAppHref = toWhatsAppHref(settings.whatsAppNumber);

  const channels = [
    settings.phoneNumber && {
      key: "phone",
      icon: Phone,
      label: "الهاتف",
      value: { text: settings.phoneNumber, ltr: true },
      href: toTelHref(settings.phoneNumber),
      tone: "bg-brand-50 text-brand-700 ring-brand-100",
    },
    whatsAppHref && {
      key: "whatsapp",
      icon: MessageCircle,
      label: "واتساب",
      value: { text: settings.whatsAppNumber, ltr: true },
      href: whatsAppHref,
      external: true,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    settings.email && {
      key: "email",
      icon: Mail,
      label: "البريد الإلكتروني",
      value: { text: settings.email, ltr: true },
      href: `mailto:${settings.email}`,
      tone: "bg-gold-50 text-gold-700 ring-gold-200",
    },
    settings.address && {
      key: "address",
      icon: MapPin,
      label: "العنوان",
      value: { text: settings.address },
      tone: "bg-brand-50 text-brand-700 ring-brand-100",
    },
  ].filter(Boolean);

  return (
    <>
      {/* The site name is appended by `Seo` from the settings, so it is not
          spelled out twice. */}
      <Seo
        title="تواصل معنا"
        description="بيانات التواصل مع إدارة منصة شوبيك لوبيك للاستفسارات والشكاوى والدعم."
      />

      <div className="mx-auto max-w-[820px] px-4 py-6 pb-20 sm:px-6 lg:py-10">
        <PageHeader
          eyebrow="الدعم"
          title="تواصل معنا"
          subtitle={`نسعد بالرد على استفساراتك حول ${siteName}.`}
        />

        {isLoading ? (
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="h-[76px] rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {/* `key` is pulled out rather than spread: React warns when a
                  props object carrying a `key` is spread into JSX, because the
                  key would be read as a prop as well as an identity. */}
              {channels.map(({ key, ...channel }) => (
                <ChannelCard key={key} {...channel} />
              ))}
            </ul>

            {socialLinks.length > 0 && (
              <section className="mt-8 rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6">
                <h2 className="text-[15px] font-bold text-ink">تابعنا</h2>

                <p className="mt-1 text-[13px] leading-6 text-muted">
                  آخر الإعلانات والعروض أولًا بأول.
                </p>

                <ul className="mt-5 flex flex-wrap gap-3">
                  {socialLinks.map((network) => (
                    <li key={network.key}>
                      <a
                        href={network.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={network.label}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        style={{ background: network.background }}
                      >
                        <network.Icon
                          className="h-[17px] w-[17px]"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {channels.length === 0 && socialLinks.length === 0 && (
              <p className="mt-7 rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-sm leading-7 text-muted">
                لم تُضف إدارة المنصة بيانات تواصل بعد.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
