export interface StorePublicInfoResponse {
  publicId: string;
  name: string;
  address: string | null;
  isActive: boolean;
  queueState: string;
  maxQueueSize: number;
}

export interface QueueSizeResponse {
  queueSize: number;
}

export interface ServiceTypePublicDto {
  id: string;
  name: string;
  prefix: string;
}
