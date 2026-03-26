"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const THEME_CYCLE = ["light", "dark", "system"] as const;
type Theme = (typeof THEME_CYCLE)[number];

const THEME_ICONS: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? ((theme as Theme) ?? "system") : "system";
  const currentIndex = THEME_CYCLE.indexOf(currentTheme);
  const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
  const Icon = THEME_ICONS[currentTheme];

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={!mounted}
      onClick={() => setTheme(nextTheme)}
      aria-label={t(currentTheme)}
    >
      <Icon className="size-4" />
    </Button>
  );
}
