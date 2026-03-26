import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("store");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-page px-4">
      <div className="glass-card glass-card-elevated flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center">
        <AlertCircleIcon
          aria-hidden="true"
          className="size-10 text-muted-foreground"
        />
        <h1 className="text-lg font-semibold">{t("storeNotFound")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("storeNotFoundDescription")}
        </p>
      </div>
    </div>
  );
}
