import axiosInstance from "../axiosInstance";

const TEXT_PARTS = {
  firstName: "FirstName",
  secondName: "SecondName",
  phone: "Phone",
  email: "Email",
  center: "Center",
  username: "Username",
};

export async function updateProfile(values = {}) {
  const formData = new FormData();

  Object.entries(TEXT_PARTS).forEach(([key, part]) => {
    const value = values[key];

    if (value === null || value === undefined || value === "") return;

    formData.append(part, String(value).trim());
  });

  // `profileImageUrl` is kept as an accepted alias so older callers that named
  // the file field after the response property keep working.
  const file = values.profileImage ?? values.profileImageUrl;

  if (file instanceof File) formData.append("ProfileImage", file);

  const response = await axiosInstance.put("/api/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
