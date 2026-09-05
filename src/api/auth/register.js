import axiosInstance from "../axiosInstance";

export const registerUser = async (data) => {
  const response = await axiosInstance.post("/api/auth/register", data);
  return response.data;
};