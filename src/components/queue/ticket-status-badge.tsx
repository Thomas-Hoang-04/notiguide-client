"use client";

import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { TicketStatus } from "@/types/queue";

const STATUS_VARIANT_MAP: Record<
  TicketStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  WAITING: "success",
  CALLED: "action",
  SERVED: "secondary",
  CANCELLED: "secondary",
  SKIPPED: "destructive",
  REQUEUED: "warning",
  UNKNOWN: "secondary",
};

const STATUS_KEY_MAP: Record<TicketStatus, string> = {
  WAITING: "waiting",
  CALLED: "called",
  SERVED: "served",
  CANCELLED: "cancelled",
  SKIPPED: "skipped",
  REQUEUED: "requeued",
  UNKNOWN: "unknown",
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({
  status,
  className,
}: TicketStatusBadgeProps) {
  const t = useTranslations("status");

  return (
    <Badge variant={STATUS_VARIANT_MAP[status]} className={className}>
      {t(STATUS_KEY_MAP[status])}
    </Badge>
  );
}
