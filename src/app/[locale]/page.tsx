import { Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function HomePage() {
  const t = useTranslations("common");
  const tMeta = useTranslations("meta");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-page px-4">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="glass-card glass-card-elevated flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center">
        <div className="flex items-center gap-2">
          <Ticket aria-hidden="true" className="size-7 text-primary" />
          <h1 className="text-2xl font-bold text-primary">{t("appName")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{tMeta("description")}</p>
      </div>
    </div>
  );
}
