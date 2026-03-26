export interface StorePublicInfoResponse {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  queueState: string;
  maxQueueSize: number;
}

export interface QueueSizeResponse {
  queueSize: number;
}
