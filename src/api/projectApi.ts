import API from "./axiosInstance";
import type { Project, User, WorkItemType } from "../types";

export interface SaveProjectPayload {
  name: string;
  key: string;
  description: string;
  leadId: number;
  defaultAssignee: "unassigned" | "lead";
  allowedIssueTypes: WorkItemType[];
  memberIds: number[];
}

export interface ProjectListResponse {
  success: boolean;
  status: boolean;
  projects: Project[];
}

export interface ProjectSingleResponse {
  success: boolean;
  status: boolean;
  message?: string;
  project: Project;
}

export interface ProjectUsersResponse {
  success: boolean;
  status: boolean;
  users: User[];
}

export interface DeleteProjectResponse {
  success: boolean;
  status: boolean;
  message?: string;
}

export const getProjectUsers = async (): Promise<ProjectUsersResponse> => {
  const response = await API.get<ProjectUsersResponse>("Project/GetUsers");
  return response.data;
};

export const getProjectList = async (): Promise<ProjectListResponse> => {
  const response = await API.get<ProjectListResponse>("Project/GetProjectList");
  return response.data;
};

export const getProjectById = async (id: string | number): Promise<ProjectSingleResponse> => {
  const response = await API.get<ProjectSingleResponse>(`Project/GetProjectById/${id}`);
  return response.data;
};

export const saveProject = async (payload: SaveProjectPayload): Promise<ProjectSingleResponse> => {
  const response = await API.post<ProjectSingleResponse>("Project/SaveProject", payload);
  return response.data;
};

export const updateProjectApi = async (
  id: string | number,
  payload: SaveProjectPayload
): Promise<ProjectSingleResponse> => {
  const response = await API.put<ProjectSingleResponse>(`Project/UpdateProject/${id}`, payload);
  return response.data;
};

export const deleteProjectApi = async (id: string | number): Promise<DeleteProjectResponse> => {
  const response = await API.delete<DeleteProjectResponse>(`Project/DeleteProject/${id}`);
  return response.data;
};
