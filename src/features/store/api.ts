import { apiFetch } from "@/lib/api";
import type {
  QueueSizeResponse,
  ServiceTypePublicDto,
  StorePublicInfoResponse,
} from "@/types/store";

export function getStoreInfo(
  storeId: string,
): Promise<StorePublicInfoResponse> {
  return apiFetch<StorePublicInfoResponse>(`/api/queue/public/${storeId}/info`);
}

export function getQueueSize(storeId: string): Promise<QueueSizeResponse> {
  return apiFetch<QueueSizeResponse>(`/api/queue/public/${storeId}/size`);
}

export function listActiveServiceTypes(
  storeId: string,
): Promise<ServiceTypePublicDto[]> {
  return apiFetch<ServiceTypePublicDto[]>(
    `/api/queue/public/${storeId}/service-types`,
  );
}
