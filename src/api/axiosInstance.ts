import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5286/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (req) => {
    try {
      const rawSession = localStorage.getItem("vision_auth_session");
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.token) {
          req.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // ignore storage / JSON parse errors
    }
    return req;
  },
  (error) => Promise.reject(error)
);

export default API;
