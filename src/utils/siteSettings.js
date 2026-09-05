import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import { resolveMediaUrl } from "./mediaUrl";
import { normalizeBrand } from "./brand";

/** Every key the admin form edits, so the form can be seeded in one pass. */
export const EDITABLE_TEXT_FIELDS = [
  "siteName",
  "siteNameEn",
  "description",
  "phoneNumber",
  "whatsAppNumber",
  "email",
  "address",
  "facebookUrl",
  "instagramUrl",
  "telegramUrl",
  "twitterUrl",
  "youTubeUrl",
  "tikTokUrl",
  "linkedInUrl",
  "termsAndConditions",
  "privacyPolicy",
  "aboutUs",
  "maintenanceMessage",
];

export const SOCIAL_NETWORKS = [
  {
    key: "facebook",
    field: "facebookUrl",
    label: "فيسبوك",
    Icon: FaFacebookF,
    background: "#1877F2",
    glow: "rgba(24,119,242,.55)",
    placeholder: "https://facebook.com/yourpage",
  },
  {
    key: "instagram",
    field: "instagramUrl",
    label: "إنستغرام",
    Icon: FaInstagram,
    background:
      "linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)",
    glow: "rgba(214,41,118,.55)",
    placeholder: "https://instagram.com/yourpage",
  },
  {
    key: "telegram",
    field: "telegramUrl",
    label: "تيليجرام",
    Icon: FaTelegram,
    background: "#229ED9",
    glow: "rgba(34,158,217,.55)",
    placeholder: "https://t.me/yourchannel",
  },
  {
    key: "twitter",
    field: "twitterUrl",
    label: "إكس",
    Icon: FaXTwitter,
    background: "#111827",
    glow: "rgba(17,24,39,.6)",
    placeholder: "https://x.com/yourpage",
  },
  {
    key: "youtube",
    field: "youTubeUrl",
    label: "يوتيوب",
    Icon: FaYoutube,
    background: "#FF0000",
    glow: "rgba(255,0,0,.5)",
    placeholder: "https://youtube.com/@yourchannel",
  },
  {
    key: "tiktok",
    field: "tikTokUrl",
    label: "تيك توك",
    Icon: FaTiktok,
    background: "#010101",
    glow: "rgba(37,244,238,.5)",
    placeholder: "https://tiktok.com/@yourpage",
  },
  {
    key: "linkedin",
    field: "linkedInUrl",
    label: "لينكد إن",
    Icon: FaLinkedinIn,
    background: "#0A66C2",
    glow: "rgba(10,102,194,.55)",
    placeholder: "https://linkedin.com/company/yourpage",
  },
];

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

export function toExternalHref(value) {
  if (typeof value !== "string") return null;

  const raw = value.trim();

  if (!raw) return null;

  const candidate = HAS_SCHEME.test(raw) ? raw : `https://${raw}`;

  let url;

  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
}

/** `"0100 000 0000"` -> `"tel:01000000000"`. Null when there is no number. */
export function toTelHref(value) {
  const digits = String(value ?? "").replace(/[^\d+]/g, "");

  return digits ? `tel:${digits}` : null;
}

export function resolveSiteSettings(data) {
  const text = (value) =>
    typeof value === "string" && value.trim() ? normalizeBrand(value.trim()) : "";

  const source = data && typeof data === "object" ? data : {};

  return {
    siteName: text(source.siteName),
    siteNameEn: text(source.siteNameEn),
    description: text(source.description),

    // Null rather than "" — these are passed straight to `src` attributes.
    logoUrl: resolveMediaUrl(source.logoUrl) ?? null,
    faviconUrl: resolveMediaUrl(source.faviconUrl) ?? null,

    phoneNumber: text(source.phoneNumber),
    whatsAppNumber: text(source.whatsAppNumber),
    email: text(source.email),
    address: text(source.address),

    facebookUrl: text(source.facebookUrl),
    instagramUrl: text(source.instagramUrl),
    telegramUrl: text(source.telegramUrl),
    twitterUrl: text(source.twitterUrl),
    youTubeUrl: text(source.youTubeUrl),
    tikTokUrl: text(source.tikTokUrl),
    linkedInUrl: text(source.linkedInUrl),

    aboutUs: text(source.aboutUs),
    termsAndConditions: text(source.termsAndConditions),
    privacyPolicy: text(source.privacyPolicy),

    maintenanceMode: Boolean(source.maintenanceMode),
    maintenanceMessage: text(source.maintenanceMessage),
  };
}

/** The networks that actually have a usable link, ready to render. */
export function socialLinksFrom(settings) {
  return SOCIAL_NETWORKS.map((network) => ({
    ...network,
    href: toExternalHref(settings?.[network.field]),
  })).filter((network) => Boolean(network.href));
}
