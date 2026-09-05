import { createContext, useState, useEffect, useMemo } from "react";
import { checkTokenExpiration } from "../utils/checkTokenExpiration";
import { logoutUser } from "../api/auth/logout";
import { isAdminToken } from "../utils/adminIdentity";

export const AuthContext = createContext();

export default function AuthContextProvider({ children }) {
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
  }
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

        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}