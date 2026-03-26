"use client";

import { MapPinIcon } from "lucide-react";
import type { StorePublicInfoResponse } from "@/types/store";

interface StoreHeaderProps {
  store: StorePublicInfoResponse;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-lg font-semibold text-foreground s:text-xl m:text-2xl">
        {store.name}
      </h1>
      {store.address && (
        <div className="flex items-start gap-1.5 text-muted-foreground">
          <MapPinIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <p className="text-sm">{store.address}</p>
        </div>
      )}
    </div>
  );
}
