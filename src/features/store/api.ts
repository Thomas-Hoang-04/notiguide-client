import { apiFetch } from "@/lib/api";
import type { QueueSizeResponse, StorePublicInfoResponse } from "@/types/store";

export function getStoreInfo(
  storeId: string,
): Promise<StorePublicInfoResponse> {
  return apiFetch<StorePublicInfoResponse>(`/api/queue/public/${storeId}/info`);
}

export function getQueueSize(storeId: string): Promise<QueueSizeResponse> {
  return apiFetch<QueueSizeResponse>(`/api/queue/public/${storeId}/size`);
}
