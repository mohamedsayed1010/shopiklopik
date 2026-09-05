import axios from "axios";

import { API_BASE_URL } from "../apiBaseUrl";

export const refreshToken = async (token, refreshToken) => {
  const response = await axios.post(
    new URL("api/auth/refresh-token", API_BASE_URL).toString(),
    {
      token,
      refreshToken,
    }
  );

  return response.data;
};
