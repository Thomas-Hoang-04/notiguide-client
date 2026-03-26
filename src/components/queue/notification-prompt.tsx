"use client";

import { BellIcon, BellOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NotificationPromptProps {
  permissionState: "prompt" | "granted" | "denied" | "unsupported";
  onRequestPermission: () => void;
  isRegistering: boolean;
}

export function NotificationPrompt({
  permissionState,
  onRequestPermission,
  isRegistering,
}: NotificationPromptProps) {
  const t = useTranslations("notification");

  if (permissionState === "unsupported") return null;
  if (permissionState === "granted") return null;

  if (permissionState === "denied") {
    return (
      <Card className="glass-card rounded-xl">
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <BellOffIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">{t("denied")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-xl">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <BellIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <div className="flex flex-1 items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("promptMessage")}</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 rounded-lg text-xs"
            onClick={onRequestPermission}
            disabled={isRegistering}
          >
            {isRegistering ? t("enabling") : t("enable")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
