"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PositionDisplayProps {
  position: number | null;
  className?: string;
}

export function PositionDisplay({ position, className }: PositionDisplayProps) {
  const t = useTranslations("queue");

  if (position === null) return null;

  // positionInQueue is already 1-indexed from the backend (Redis ZRANK + 1)
  const displayPosition = position;
  const isNext = position === 1;

  return (
    <div
      className={cn(
        "position-animate flex flex-col items-center gap-1",
        className,
      )}
      aria-live="polite"
    >
      <p className="text-2xl font-bold text-primary s:text-3xl m:text-4xl">
        {t("positionDisplay", { position: displayPosition })}
      </p>
      <p className="text-sm text-muted-foreground">
        {isNext
          ? t("noPeopleAhead")
          : t("peopleAhead", { count: position - 1 })}
      </p>
    </div>
  );
}
