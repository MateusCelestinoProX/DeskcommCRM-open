"use client";

import * as React from "react";
import { useTheme } from "@/lib/theme";
import { useHotkeys } from "react-hotkeys-hook";
import { Sun, Moon, Lightning, MonitorPlay, Palette, Sparkle } from "@/lib/ui/icons";
import { Button } from "@/components/ui/button";
import { ThemeGalleryModal } from "./ThemeGalleryModal";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggle } = useTheme();
  const [modalOpen, setModalOpen] = React.useState(false);

  // Atalho Mod+Shift+T abre a Galeria de Temas
  useHotkeys("mod+shift+t", () => setModalOpen(true), { preventDefault: true });

  // Atalho Mod+Shift+L continua funcionando para alternância rápida em ciclo
  useHotkeys("mod+shift+l", toggle, { preventDefault: true });

  const getIcon = () => {
    if (resolvedTheme === "ultra-black" || resolvedTheme === "solar-flare") return Lightning;
    if (
      resolvedTheme === "cyberpunk-neon" ||
      resolvedTheme === "midnight-tokyo" ||
      resolvedTheme === "emerald-matrix" ||
      resolvedTheme === "neon-dracula"
    )
      return Palette;
    if (
      resolvedTheme === "luxury-gold" ||
      resolvedTheme === "monokai-pro" ||
      resolvedTheme === "deep-crimson" ||
      resolvedTheme === "deep-sapphire"
    )
      return Sparkle;
    if (
      resolvedTheme === "dark" ||
      resolvedTheme === "nordic-frost" ||
      resolvedTheme === "sunset-horizon" ||
      resolvedTheme === "coffee-mocha"
    )
      return Moon;
    if (theme === "system") return MonitorPlay;
    return Sun;
  };

  const Icon = getIcon();

  const label = `Tema atual: ${theme}. Clique para abrir a Galeria de Temas (Mod+Shift+T).`;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setModalOpen(true)}
        aria-label={label}
        title={label}
        className={
          resolvedTheme === "ultra-black"
            ? "text-white ring-1 ring-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            : resolvedTheme === "cyberpunk-neon"
            ? "text-cyan-400 ring-1 ring-cyan-400/40 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
            : resolvedTheme === "midnight-tokyo"
            ? "text-purple-400 ring-1 ring-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
            : resolvedTheme === "luxury-gold" || resolvedTheme === "light-amber"
            ? "text-amber-300 ring-1 ring-amber-300/40 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
            : resolvedTheme === "emerald-matrix" || resolvedTheme === "light-emerald"
            ? "text-emerald-400 ring-1 ring-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            : resolvedTheme === "deep-crimson" || resolvedTheme === "light-rose"
            ? "text-rose-400 ring-1 ring-rose-400/40 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
            : resolvedTheme === "solar-flare" || resolvedTheme === "light-sand"
            ? "text-orange-400 ring-1 ring-orange-400/40 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
            : resolvedTheme === "deep-sapphire" || resolvedTheme === "light-ocean" || resolvedTheme === "light-nordic"
            ? "text-blue-400 ring-1 ring-blue-400/40 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            : resolvedTheme === "neon-dracula" || resolvedTheme === "light-lavender"
            ? "text-fuchsia-400 ring-1 ring-fuchsia-400/40 shadow-[0_0_8px_rgba(232,121,249,0.4)]"
            : undefined
        }
      >
        <Icon size={16} aria-hidden />
      </Button>

      <ThemeGalleryModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
