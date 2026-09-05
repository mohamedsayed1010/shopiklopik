import axiosInstance from "../axiosInstance";

export async function loginUser(data) {
  const response = await axiosInstance.post("/api/auth/login", data);
  return response.data;
}