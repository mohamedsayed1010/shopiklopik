import axiosInstance from "../axiosInstance";

export async function uploadProfileImage(file) {
  const formData = new FormData();

  formData.append("ProfileImage", file);

  const response = await axiosInstance.post("/api/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export default uploadProfileImage;
