"use client";

import { useTheme } from "@/lib/theme";
import { useHotkeys } from "react-hotkeys-hook";
import { Sun, Moon, Lightning, MonitorPlay } from "@/lib/ui/icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    setTheme(
      theme === "light"
        ? "dark"
        : theme === "dark"
          ? "ultra-black"
          : theme === "ultra-black"
            ? "system"
            : "light"
    );
  };

  useHotkeys("mod+shift+l", cycle, { preventDefault: true }, [theme]);

  const Icon =
    theme === "ultra-black"
      ? Lightning
      : theme === "dark"
        ? Moon
        : theme === "system"
          ? MonitorPlay
          : Sun;

  const label =
    theme === "ultra-black"
      ? "Tema: Ultra Black Contrast (Deep AMOLED). Cmd+Shift+L para alternar."
      : `Tema: ${theme}. Cmd+Shift+L para alternar.`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={theme === "ultra-black" ? "text-white ring-1 ring-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" : undefined}
    >
      <Icon size={16} aria-hidden />
    </Button>
  );
}

