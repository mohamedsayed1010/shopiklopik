import axiosInstance from "../../axiosInstance";
import { SOCIAL_NETWORKS, toExternalHref } from "../../../utils/siteSettings";

/** The seven link fields, which are sent as absolute URLs whatever was typed. */
const URL_FIELDS = new Set(SOCIAL_NETWORKS.map((network) => network.field));

const BASE = "/api/v2/admin/settings";

export async function getAdminSettings() {
  const response = await axiosInstance.get(BASE);

  return response.data;
}

export const UPDATE_SETTINGS_FIELDS = [
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
  "maintenanceMode",
  "maintenanceMessage",
];

export function buildUpdateSettingsBody(values) {
  const body = {};

  for (const field of UPDATE_SETTINGS_FIELDS) {
    if (field === "maintenanceMode") {
      body[field] = Boolean(values?.[field]);

      continue;
    }

    const value = values?.[field];

    const text = typeof value === "string" ? value.trim() : value ?? "";

    if (text === "") {
      body[field] = null;

      continue;
    }

    body[field] = URL_FIELDS.has(field) ? toExternalHref(text) ?? text : text;
  }

  return body;
}

/** PUT the settings. Answers with the updated `AdminSettingsDto`. */
export async function updateAdminSettings(values) {
  const response = await axiosInstance.put(BASE, buildUpdateSettingsBody(values));

  return response.data;
}

async function putBrandingFile(path, partName, file, onUploadProgress) {
  const formData = new FormData();

  formData.append(partName, file);

  const response = await axiosInstance.put(`${BASE}/${path}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data;
}

export function uploadSettingsLogo(file, onUploadProgress) {
  return putBrandingFile("logo", "logo", file, onUploadProgress);
}

export function uploadSettingsFavicon(file, onUploadProgress) {
  return putBrandingFile("favicon", "favicon", file, onUploadProgress);
}

export async function getAdminUploadLimits() {
  const response = await axiosInstance.get(`${BASE}/upload-limits`);

  return response.data;
}
