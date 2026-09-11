import axios from "axios";
import { refreshToken } from "./auth/refreshToken";

// ======================
// Logout Helper
// ======================

const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessTokenExpiration");
  localStorage.removeItem("refreshTokenExpiration");
  localStorage.removeItem("user");

  window.location.replace("/login");
};

// ======================
// Axios Instance
// ======================

import { API_BASE_URL } from "./apiBaseUrl";

export { API_BASE_URL };

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================
// Refresh Queue
// ======================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// ======================
// Request Interceptor
// ======================

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================
// Response Interceptor
// ======================

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      /* Signing in with Google, and reading the client it runs against. A 401
         here is that sign-in being refused, not the current session expiring —
         refreshing a stale one and retrying would answer the wrong question,
         and could sign the reader out of the screen they are signing in on. */
      originalRequest.url?.includes("/auth/google") ||
      /* Signing out. A 401 here means the session is already gone — an account
         that was just deactivated, say. Refreshing only to sign out would be
         backwards, and a failed refresh hard-redirects to /login, pre-empting
         the caller's own navigation. `AuthContext.logout` clears the session
         whatever this call answers. */
      originalRequest.url?.includes("/auth/logout") ||
      /* Closing the account. The endpoint re-checks the password and answers a
         wrong one with 401 ("كلمة السر غلط.") — the password being refused, not
         the session expiring. Refreshing and retrying would send the password
         twice and count every failed attempt double against the rate limit.
         The access token is kept fresh ahead of expiry by
         `checkTokenExpiration`, so a real expiry here is not the likely 401. */
      (originalRequest.url === "/api/account" &&
        originalRequest.method === "delete") ||
      originalRequest.url?.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    /* No session at all — nothing to refresh and nothing to sign out of. A 401
       here is the endpoint saying "this needs an account", which is a normal
       answer on a public page: the marketplace is browsable signed out, and an
       optional user-specific request must not be able to throw the reader onto
       the login screen. The caller handles it; the page stays where it is. */
    const hasSession =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("refreshToken");

    if (!hasSession) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // لو فيه Refresh شغال بالفعل
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const accessToken = localStorage.getItem("accessToken");
      const refresh = localStorage.getItem("refreshToken");

      if (!refresh) {
        logout();
        return Promise.reject(error);
      }

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

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("accessTokenExpiration", expiration);
      localStorage.setItem(
        "refreshTokenExpiration",
        refreshTokenExpiration
      );
      localStorage.setItem("user", JSON.stringify(user));

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return axiosInstance(originalRequest);

    } catch (err) {
      processQueue(err);

      logout();

      return Promise.reject(err);

    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;