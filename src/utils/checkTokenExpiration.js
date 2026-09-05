import { refreshToken } from "../api/auth/refreshToken";

let refreshTimer = null;

// أقصى مدة آمنة لـ setTimeout (24 يوم)
const MAX_TIMEOUT = 24 * 24 * 60 * 60 * 1000;

// هنجدد قبل انتهاء الـ Access Token بـ 10 أيام
const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;

export async function checkTokenExpiration() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  const accessToken = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");

  const accessExpiration = localStorage.getItem(
    "accessTokenExpiration"
  );

  const refreshExpiration = localStorage.getItem(
    "refreshTokenExpiration"
  );

  if (
    !accessToken ||
    !refresh ||
    !accessExpiration ||
    !refreshExpiration
  ) {
    return;
  }

  const now = Date.now();

  const accessExpirationTime =
    new Date(accessExpiration).getTime();

  const refreshExpirationTime =
    new Date(refreshExpiration).getTime();

  // ======================
  // لو الـ Refresh Token انتهى
  // ======================

  if (now >= refreshExpirationTime) {
    logout();
    return;
  }

  // ======================
  // نحسب امتى نجدد
  // ======================

  const refreshAfter =
    accessExpirationTime - now - TEN_DAYS;

  // لسه بدري على التجديد
  if (refreshAfter > 0) {
    refreshTimer = setTimeout(() => {
      checkTokenExpiration();
    }, Math.min(refreshAfter, MAX_TIMEOUT));

    return;
  }

  // ======================
  // Refresh Token Request
  // ======================

  try {
    const response = await refreshToken(
      accessToken,
      refresh
    );

    const {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiration,
      refreshTokenExpiration,
      user,
    } = response.data;

    localStorage.setItem(
      "accessToken",
      newAccessToken
    );

    localStorage.setItem(
      "refreshToken",
      newRefreshToken
    );

    localStorage.setItem(
      "accessTokenExpiration",
      expiration
    );

    localStorage.setItem(
      "refreshTokenExpiration",
      refreshTokenExpiration
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    // نبدأ العد من جديد بالتوكن الجديد
    checkTokenExpiration();

  } catch {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  logout();
}
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessTokenExpiration");
  localStorage.removeItem("refreshTokenExpiration");
  localStorage.removeItem("user");

  window.location.replace("/login");
}