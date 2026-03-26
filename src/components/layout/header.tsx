"use client";

import { ArrowLeftIcon, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
}

export function Header({ showBack = false, backHref }: HeaderProps) {
  const t = useTranslations("common");
  const router = useRouter();

  return (
    <header className="header-glass sticky top-0 z-40 flex h-12 items-center justify-between px-3 s:px-4 xl:h-14">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label={t("back")}
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
          </Button>
        )}
        <Ticket aria-hidden="true" className="size-5 text-primary" />
        <span className="text-sm font-semibold text-primary s:text-base">
          {t("appName")}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
