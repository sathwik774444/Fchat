import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/uploads", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.file;
}
