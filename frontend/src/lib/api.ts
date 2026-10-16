import axios from "axios";
import { DetectionResult, HistoryRecord } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120s: covers free-tier server cold start (~50s) plus model inference
});

export async function signupUser(name: string, email: string, password: string): Promise<void> {
  await apiClient.post("/api/auth/signup", { name, email, password });
}

export async function detectPlate(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<DetectionResult>("/api/detect-plate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getHistory(limit = 50, offset = 0): Promise<{ total: number; records: HistoryRecord[] }> {
  const response = await apiClient.get<{ total: number; records: HistoryRecord[] }>("/api/history", {
    params: { limit, offset },
  });
  return response.data;
}

export async function updatePlate(id: number, plate_number: string): Promise<{ success: boolean; record: HistoryRecord }> {
  const response = await apiClient.put<{ success: boolean; record: HistoryRecord }>(`/api/plates/${id}`, {
    plate_number,
  });
  return response.data;
}

export async function deletePlate(id: number): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/plates/${id}`);
  return response.data;
}
