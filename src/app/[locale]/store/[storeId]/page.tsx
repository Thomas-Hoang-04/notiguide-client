import type { Metadata } from "next";
import { API_BASE_URL } from "@/lib/constants";
import type { StorePublicInfoResponse } from "@/types/store";
import { StorePageContent } from "./store-page-content";

interface StorePageProps {
  params: Promise<{ locale: string; storeId: string }>;
}

async function fetchStoreInfoForMetadata(
  storeId: string,
): Promise<StorePublicInfoResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/queue/public/${encodeURIComponent(storeId)}/info`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as StorePublicInfoResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { locale, storeId } = await params;
  const storeInfo = await fetchStoreInfoForMetadata(storeId);
  if (!storeInfo) return {};

  return {
    alternates: {
      canonical: `/${locale}/store/${storeInfo.canonicalId}`,
    },
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { storeId } = await params;

  return <StorePageContent storeId={storeId} />;
}
