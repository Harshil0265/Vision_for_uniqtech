import API from "./axiosInstance";
import type { AuthResponse, LoginRequest, MeResponse, SignupRequest } from "../types/api";

export const signupUser = async (userData: SignupRequest): Promise<AuthResponse> => {
  try {
    const response = await API.post<AuthResponse>("Auth/signup", userData);
    return response.data;
  } catch (error) {
    console.error("Error registering user", error);
    throw error;
  }
};

export const loginUser = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await API.post<AuthResponse>("Auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error signing in", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<MeResponse> => {
  try {
    const response = await API.get<MeResponse>("Auth/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await API.post("Auth/logout");
  } catch (error) {
    console.error("Error logging out", error);
  }
};
