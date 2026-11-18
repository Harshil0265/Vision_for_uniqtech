import API from "./axiosInstance";
import type { Issue, KanbanColumn, Priority, Sprint, WorkItemType } from "../types";

export interface SaveWorkItemPayload {
  projectId: number;
  type: WorkItemType;
  title: string;
  description: string;
  priority: Priority;
  status: string;
  assigneeId: number | null;
  sprintId: number | null;
  storyPoints: number;
  dueDate: string | null;
  epicKey: string | null;
  labels: string[];
}

export interface WorkItemLookupsResponse {
  success: boolean;
  status: boolean;
  columns: KanbanColumn[];
  sprints: Sprint[];
}

export interface WorkItemListResponse {
  success: boolean;
  status: boolean;
  workItems: Issue[];
}

export interface WorkItemSingleResponse {
  success: boolean;
  status: boolean;
  message?: string;
  workItem: Issue;
}

export interface DeleteWorkItemResponse {
  success: boolean;
  status: boolean;
  message?: string;
}

export const getWorkItemLookups = async (): Promise<WorkItemLookupsResponse> => {
  const response = await API.get<WorkItemLookupsResponse>("WorkItem/GetLookups");
  return response.data;
};

export const getWorkItemList = async (projectId?: string | number): Promise<WorkItemListResponse> => {
  const url = projectId ? `WorkItem/GetWorkItemList?projectId=${projectId}` : "WorkItem/GetWorkItemList";
  const response = await API.get<WorkItemListResponse>(url);
  return response.data;
};

export const getWorkItemById = async (id: string | number): Promise<WorkItemSingleResponse> => {
  const response = await API.get<WorkItemSingleResponse>(`WorkItem/GetWorkItemById/${id}`);
  return response.data;
};

export const saveWorkItem = async (payload: SaveWorkItemPayload): Promise<WorkItemSingleResponse> => {
  const response = await API.post<WorkItemSingleResponse>("WorkItem/SaveWorkItem", payload);
  return response.data;
};

export const updateWorkItemApi = async (
  id: string | number,
  payload: SaveWorkItemPayload
): Promise<WorkItemSingleResponse> => {
  const response = await API.put<WorkItemSingleResponse>(`WorkItem/UpdateWorkItem/${id}`, payload);
  return response.data;
};

export const deleteWorkItemApi = async (id: string | number): Promise<DeleteWorkItemResponse> => {
  const response = await API.delete<DeleteWorkItemResponse>(`WorkItem/DeleteWorkItem/${id}`);
  return response.data;
};
