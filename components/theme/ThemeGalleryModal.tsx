"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTheme, THEME_PRESETS, ResolvedTheme, ThemePreset } from "@/lib/theme";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  CheckCircle,
  X,
  Sparkle,
  MonitorPlay,
  Check,
  Sun,
  Moon,
} from "@/lib/ui/icons";

interface ThemeGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CategoryFilter = "all" | "Claros" | "Dark & OLED" | "Cyber & Neon" | "Elegantes";

export function ThemeGalleryModal({ open, onOpenChange }: ThemeGalleryModalProps) {
  const t = useT();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryFilter>("all");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll do body enquanto o modal estiver aberto
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Fechar no Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open || !mounted || typeof document === "undefined") return null;

  const categories: Array<{ id: CategoryFilter; label: string; count: number }> = [
    { id: "all", label: t("Todos os Temas"), count: THEME_PRESETS.length },
    {
      id: "Claros",
      label: t("Claros & Clean"),
      count: THEME_PRESETS.filter((p) => p.category === "Claros").length,
    },
    {
      id: "Dark & OLED",
      label: t("OLED & Escuros"),
      count: THEME_PRESETS.filter((p) => p.category === "Dark & OLED").length,
    },
    {
      id: "Cyber & Neon",
      label: t("Cyber & Neon"),
      count: THEME_PRESETS.filter((p) => p.category === "Cyber & Neon").length,
    },
    {
      id: "Elegantes",
      label: t("Elegantes & Pro"),
      count: THEME_PRESETS.filter((p) => p.category === "Elegantes").length,
    },
  ];

  const filteredThemes =
    selectedCategory === "all"
      ? THEME_PRESETS
      : THEME_PRESETS.filter((item) => item.category === selectedCategory);

  const handleSelectTheme = (id: ResolvedTheme) => {
    setTheme(id);
  };

  const isTextDarkOnAccent = (preset: ThemePreset) => {
    // Retorna se o texto dentro do botão accent deve ser preto (#000000)
    if (preset.id === "cyberpunk-neon" || preset.id === "ultra-black" || preset.id === "monokai-pro" || preset.id === "neon-dracula" || preset.id === "solar-flare" || preset.id === "emerald-matrix" || preset.id === "nordic-frost" || preset.id === "sunset-horizon" || preset.id === "luxury-gold") {
      return true;
    }
    return false;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[88vh] bg-neutral-950 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Painel */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center text-white">
                <Palette size={20} weight="bold" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  {t("Galeria de Temas Ultra-Modernos")}
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                  {THEME_PRESETS.length} {t("Estilos")}
                </Badge>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                {t("22 temas cuidadosamente calibrados: modos claros energizantes e paletas escuras imersivas de alto contraste.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t("Fechar painel")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Modo do Sistema */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-white text-black shadow-md font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id ? "bg-black/20 text-black font-bold" : "bg-white/10 text-white/60"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme("system")}
              className={`h-8 text-xs font-mono gap-1.5 border-white/20 cursor-pointer ${
                theme === "system"
                  ? "bg-white/15 text-white border-white/40"
                  : "text-white/70 hover:text-white"
              }`}
              title={t("Seguir automaticamente o tema do sistema operacional")}
            >
              <MonitorPlay size={13} />
              {t("Auto (Sistema)")}
              {theme === "system" && <Check size={12} className="text-emerald-400" />}
            </Button>
          </div>
        </div>

        {/* Grid de Cards de Temas */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredThemes.map((preset) => {
            const isActive = resolvedTheme === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectTheme(preset.id)}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? "border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-2 ring-white/60 scale-[1.01]"
                    : "border-white/15 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.07] hover:scale-[1.01]"
                }`}
                style={{
                  boxShadow: isActive && preset.colors.accentGlow ? `0 0 25px ${preset.colors.accentGlow}` : undefined,
                }}
              >
                {/* Topo do Card: Título + Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          {preset.name}
                        </h3>
                        {preset.badge && (
                          <Badge
                            className="text-[9px] font-mono py-0 px-1.5 border"
                            style={{
                              backgroundColor: `${preset.colors.accent}20`,
                              borderColor: `${preset.colors.accent}60`,
                              color: preset.colors.accent,
                            }}
                          >
                            {preset.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                          {preset.category}
                        </span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-0.5">
                          {preset.isDark ? <Moon size={10} /> : <Sun size={10} />}
                          {preset.isDark ? t("Escuro") : t("Claro")}
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <Badge className="bg-emerald-500 text-black font-black text-[10px] gap-1 shrink-0 py-0.5">
                        <CheckCircle size={12} weight="fill" />
                        {t("ATIVO")}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-white/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("Clique para aplicar")}
                      </span>
                    )}
                  </div>

                  {/* Mockup da Interface do CRM */}
                  <div
                    className="w-full h-32 rounded-xl p-2.5 flex flex-col justify-between border shadow-inner overflow-hidden transition-transform group-hover:shadow-md"
                    style={{
                      backgroundColor: preset.colors.bg,
                      borderColor: preset.colors.border,
                      color: preset.colors.text,
                    }}
                  >
                    {/* TopBar Mock */}
                    <div
                      className="flex items-center justify-between pb-1.5 border-b text-[10px]"
                      style={{ borderColor: preset.colors.border }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <span className="font-bold text-[9px] tracking-wider uppercase opacity-90">
                          DeskComm CRM
                        </span>
                      </div>
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${preset.colors.accent}25`,
                          color: preset.colors.accent,
                        }}
                      >
                        PRO
                      </span>
                    </div>

                    {/* Conteúdo Central Mock */}
                    <div className="grid grid-cols-3 gap-2 my-auto">
                      <div
                        className="col-span-1 rounded-lg p-1.5 space-y-1 border text-[8px]"
                        style={{
                          backgroundColor: preset.colors.surface,
                          borderColor: preset.colors.border,
                        }}
                      >
                        <div
                          className="w-10 h-1.5 rounded-full"
                          style={{
                            backgroundColor: preset.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                          }}
                        />
                        <div
                          className="w-6 h-1.5 rounded-full"
                          style={{
                            backgroundColor: preset.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                          }}
                        />
                        <div
                          className="w-8 h-1.5 rounded-full"
                          style={{
                            backgroundColor: preset.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                          }}
                        />
                      </div>

                      <div
                        className="col-span-2 rounded-lg p-2 border flex flex-col justify-between"
                        style={{
                          backgroundColor: preset.colors.surface,
                          borderColor: preset.colors.border,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold truncate">Disparador</span>
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                        </div>
                        <div
                          className="w-full py-1 rounded text-[8px] font-bold text-center mt-1"
                          style={{
                            backgroundColor: preset.colors.accent,
                            color: isTextDarkOnAccent(preset) ? "#000000" : "#ffffff",
                          }}
                        >
                          Disparar
                        </div>
                      </div>
                    </div>

                    {/* Rodapé Mock */}
                    <div className="flex items-center justify-between text-[8px] opacity-60 font-mono">
                      <span>Status: Online</span>
                      <span>WAHA 3030</span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Paleta de Cores em Amostras */}
                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                    {t("Paleta")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: preset.colors.bg }}
                      title="Fundo principal"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: preset.colors.surface }}
                      title="Superfície / Cards"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: preset.colors.border }}
                      title="Bordas e divisores"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: preset.colors.accent }}
                      title="Cor de destaque (Accent)"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: preset.colors.text }}
                      title="Texto principal"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkle size={14} className="text-emerald-400" />
            <span>
              {t("O tema escolhido é persistido instantaneamente em seu navegador.")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-white/90 text-black font-bold text-xs h-8 px-4 cursor-pointer"
            >
              {t("Concluir")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
