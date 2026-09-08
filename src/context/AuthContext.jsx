import { createContext, useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { checkTokenExpiration } from "../utils/checkTokenExpiration";
import { logoutUser } from "../api/auth/logout";
import { isAdminToken } from "../utils/adminIdentity";

export const AuthContext = createContext();

export default function AuthContextProvider({ children }) {
  /* `QueryClientProvider` sits above this provider in `App`, so the cache can
     be emptied from here — see `login` and `logout` for why it has to be. */
  const queryClient = useQueryClient();

  const [token, setToken] = useState(() =>
    localStorage.getItem("accessToken")
  );

  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refreshToken")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  function login(
    accessToken,
    newRefreshToken,
    accessTokenExpiration,
    refreshTokenExpiration,
    user
  ) {
    localStorage.setItem("accessToken", accessToken);

    localStorage.setItem(
      "refreshToken",
      newRefreshToken
    );

    localStorage.setItem(
      "accessTokenExpiration",
      accessTokenExpiration
    );

    localStorage.setItem(
      "refreshTokenExpiration",
      refreshTokenExpiration
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setUser(user);

    /* A new session must not inherit the previous one's answers — the profile,
       the favourites, the grants. Emptying the cache here is also what makes
       the completeness check ask the server about *this* account. */
    queryClient.clear();
  }

  function updateAuth(
    accessToken,
    newRefreshToken,
    accessTokenExpiration,
    refreshTokenExpiration,
    user
  ) {
    localStorage.setItem("accessToken", accessToken);

    localStorage.setItem(
      "refreshToken",
      newRefreshToken
    );

    localStorage.setItem(
      "accessTokenExpiration",
      accessTokenExpiration
    );

    localStorage.setItem(
      "refreshTokenExpiration",
      refreshTokenExpiration
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setUser(user);
  }

async function logout() {
  try {
    await logoutUser();
  } catch (error) {
    console.error(error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessTokenExpiration");
    localStorage.removeItem("refreshTokenExpiration");
    localStorage.removeItem("user");

    setToken(null);
    setRefreshToken(null);
    setUser(null);

    /* Same reason as `login`: the profile, and the completion requirement
       derived from it, must not outlive the account they belonged to. */
    queryClient.clear();
  }
}
  /**
   * Fold a fresh `UserDto` — the answer to a profile update, say — into the
   * stored account, so the state and `localStorage` keep telling one story.
   * The tokens are untouched: completing a profile is not a new session.
   */
  function patchUser(partial) {
    if (!partial || typeof partial !== "object") return;

    setUser((previous) => {
      const next = { ...(previous ?? {}), ...partial };

      localStorage.setItem("user", JSON.stringify(next));

      return next;
    });
  }

  const isAuthenticated = !!token;

  const isAdmin = useMemo(() => isAdminToken(token), [token]);

  useEffect(() => {
    checkTokenExpiration();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        user,

        setToken,
        setRefreshToken,
        setUser,

        login,
        updateAuth,
        logout,
        patchUser,

        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}