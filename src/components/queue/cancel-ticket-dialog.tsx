"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CancelTicketDialogProps {
  onConfirm: () => void;
  isCancelling: boolean;
  error: "rateLimited" | "network" | null;
  rateLimitSeconds: number | null;
}

export function CancelTicketDialog({
  onConfirm,
  isCancelling,
  error,
  rateLimitSeconds,
}: CancelTicketDialogProps) {
  const t = useTranslations("queue");
  const tErrors = useTranslations("errors");

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            className="h-10 w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {t("cancelTicket")}
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("cancelConfirmMessage")}
          </AlertDialogDescription>
          {error === "rateLimited" && rateLimitSeconds && (
            <p className="text-xs text-destructive">
              {tErrors("rateLimited", { seconds: rateLimitSeconds })}
            </p>
          )}
          {error === "network" && (
            <p className="text-xs text-destructive">
              {tErrors("networkError")}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keepTicket")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <LoaderCircleIcon
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              t("yesCancel")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
