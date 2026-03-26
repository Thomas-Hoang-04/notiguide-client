"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JoinQueueButtonProps {
  onJoin: () => void;
  isJoining: boolean;
  disabled?: boolean;
  className?: string;
}

export function JoinQueueButton({
  onJoin,
  isJoining,
  disabled = false,
  className,
}: JoinQueueButtonProps) {
  const t = useTranslations("queue");

  return (
    <Button
      onClick={onJoin}
      disabled={isJoining || disabled}
      className={cn(
        "h-12 w-full rounded-xl text-base font-semibold xs:h-14 xs:text-lg",
        disabled && "bg-disabled-surface text-disabled-text",
        className,
      )}
    >
      {isJoining ? (
        <>
          <LoaderCircleIcon
            aria-hidden="true"
            className="size-5 animate-spin"
          />
          {t("joining")}
        </>
      ) : (
        t("joinQueue")
      )}
    </Button>
  );
}
