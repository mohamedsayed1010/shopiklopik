const CONFIGURED =
  import.meta.env.VITE_API_BASE_URL || "https://api.shopiklopik.com/";

export const API_BASE_URL = CONFIGURED.endsWith("/")
  ? CONFIGURED
  : `${CONFIGURED}/`;

export default API_BASE_URL;
