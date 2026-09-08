"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/lib/theme";
import { BACKGROUND_PRESETS } from "@/lib/webgl/mcp-os-backgrounds";
import { GALLERY_PRESETS, isGalleryPreset } from "@/lib/webgl/mcp-os-galleries";
import { DESKCOMM_BG_STORAGE_KEY, DESKCOMM_BG_CHANGE_EVENT } from "./McpOsBackgroundCanvas";
import { Sparkle, Check, X, ArrowsClockwise, Lightning, Image as ImageIcon } from "@/lib/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BackgroundsButton() {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"webgl" | "gallery">("webgl");
  const [activeBg, setActiveBg] = React.useState<string>(() => {
    if (typeof window === "undefined") return "strands";
    try {
      return window.localStorage.getItem(DESKCOMM_BG_STORAGE_KEY) || "strands";
    } catch {
      return "strands";
    }
  });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Escuta trocas de background para atualizar o indicador de ativo
  React.useEffect(() => {
    const handleBgChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ bg: string }>;
      if (customEvent.detail?.bg) {
        setActiveBg(customEvent.detail.bg);
        if (isGalleryPreset(customEvent.detail.bg)) {
          setActiveTab("gallery");
        } else {
          setActiveTab("webgl");
        }
      }
    };
    window.addEventListener(DESKCOMM_BG_CHANGE_EVENT, handleBgChange);
    return () => window.removeEventListener(DESKCOMM_BG_CHANGE_EVENT, handleBgChange);
  }, []);

  // Fechar no Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Se o tema não for mcp-os-multi, não renderiza o botão
  if (resolvedTheme !== "mcp-os-multi") {
    return null;
  }

  const selectBg = (bgId: string) => {
    setActiveBg(bgId);
    try {
      window.localStorage.setItem(DESKCOMM_BG_STORAGE_KEY, bgId);
      window.dispatchEvent(
        new CustomEvent(DESKCOMM_BG_CHANGE_EVENT, { detail: { bg: bgId } })
      );
    } catch (err) {
      console.error("Erro ao salvar background:", err);
    }
  };

  // Ciclo rápido avança entre os itens da aba atual
  const cycleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeTab === "webgl") {
      const currentIndex = BACKGROUND_PRESETS.findIndex((b) => b.id === activeBg);
      const nextIndex = (currentIndex + 1) % BACKGROUND_PRESETS.length;
      const nextPreset = BACKGROUND_PRESETS[nextIndex] ?? BACKGROUND_PRESETS[0];
      if (nextPreset) selectBg(nextPreset.id);
    } else {
      const currentIndex = GALLERY_PRESETS.findIndex((g) => g.id === activeBg);
      const nextIndex = (currentIndex + 1) % GALLERY_PRESETS.length;
      const nextPreset = GALLERY_PRESETS[nextIndex] ?? GALLERY_PRESETS[0];
      if (nextPreset) selectBg(nextPreset.id);
    }
  };

  // Encontra informações do background ativo
  const activeWebGL = BACKGROUND_PRESETS.find((b) => b.id === activeBg);
  const activeGallery = GALLERY_PRESETS.find((g) => g.id === activeBg);
  const activeName = activeWebGL ? activeWebGL.name : (activeGallery ? activeGallery.name : "Strands");
  const activeBadge = activeWebGL ? activeWebGL.badge : (activeGallery ? activeGallery.badge : "Shaders");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        title={"Fundo MCP OS: " + activeName + ". Clique para escolher entre os 13 shaders ou 6 galerias de imagem."}
        className="h-9 px-3 rounded-full border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-100 hover:text-white shadow-[0_0_16px_rgba(167,139,250,0.30)] backdrop-blur-md transition-all gap-1.5 font-medium text-xs border"
      >
        <Sparkle size={14} className="text-purple-300 animate-pulse" weight="fill" />
        <span className="hidden sm:inline font-semibold">Backgrounds</span>
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-500/25 text-purple-200 font-mono border border-purple-400/30">
          {activeBadge}
        </span>
      </Button>

      {open && mounted && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Modal Liquid Glass Ultra Premium */}
            <div
              className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-white/20 bg-[#090b16]/95 shadow-[0_24px_90px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.20)] backdrop-blur-3xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/12 bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                    <Lightning size={20} weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                      Backgrounds MCP OS
                      <Badge variant="outline" className="border-purple-400/40 bg-purple-500/20 text-purple-200 text-[10px] font-mono">
                        13 Shaders · 66 Fotos
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Cenários dinâmicos de alta performance renderizados em todas as telas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cycleNext}
                    className="h-8 px-2.5 rounded-lg border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs gap-1.5 font-medium"
                    title="Avançar para o próximo cenário em ciclo"
                  >
                    <ArrowsClockwise size={13} />
                    <span>Ciclo Rápido</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/15"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Abas de Navegação (Shaders WebGL vs Galerias de Fotos) */}
              <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setActiveTab("webgl")}
                  className={
                    activeTab === "webgl"
                      ? "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600/30 text-purple-200 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all"
                      : "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  }
                >
                  <Sparkle size={14} weight="fill" />
                  <span>Shaders WebGL ({BACKGROUND_PRESETS.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("gallery")}
                  className={
                    activeTab === "gallery"
                      ? "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600/30 text-purple-200 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all"
                      : "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  }
                >
                  <ImageIcon size={14} weight="fill" />
                  <span>Galerias de Fotos ({GALLERY_PRESETS.length} Coleções)</span>
                </button>
              </div>

              {/* Conteúdo da Aba */}
              <div className="p-6 overflow-y-auto max-h-[calc(88vh-130px)]">
                {/* ABA 1: SHADERS WEBGL */}
                {activeTab === "webgl" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const isSelected = preset.id === activeBg;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => selectBg(preset.id)}
                          className={
                            isSelected
                              ? "group relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 border-purple-400/70 bg-purple-500/20 shadow-[0_0_24px_rgba(167,139,250,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                              : "group relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 border-white/10 bg-white/[0.04] hover:border-purple-400/40 hover:bg-white/[0.08]"
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">
                                {preset.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-slate-300 font-mono">
                                {preset.badge}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(167,139,250,0.7)] flex-shrink-0">
                                <Check size={12} weight="bold" />
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                            {preset.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/8">
                            <span>{preset.category}</span>
                            <span className="text-[10px] font-semibold text-purple-300 font-mono">
                              {isSelected ? "● ATIVO" : "Ativar ➜"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ABA 2: GALERIAS DE FOTOS MCP OS */}
                {activeTab === "gallery" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GALLERY_PRESETS.map((preset) => {
                      const isSelected = preset.id === activeBg;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => selectBg(preset.id)}
                          className={
                            isSelected
                              ? "group relative rounded-xl border cursor-pointer transition-all overflow-hidden flex flex-col border-purple-400/70 bg-purple-500/20 shadow-[0_0_24px_rgba(167,139,250,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                              : "group relative rounded-xl border cursor-pointer transition-all overflow-hidden flex flex-col border-white/12 bg-white/[0.04] hover:border-purple-400/40 hover:bg-white/[0.08]"
                          }
                        >
                          {/* Miniatura da Capa */}
                          <div
                            className="h-28 w-full bg-cover bg-center relative flex items-start justify-between p-2.5"
                            style={{ backgroundImage: 'url("' + preset.coverImage + '")' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-black/40 to-transparent" />
                            <Badge className="relative z-10 text-[10px] font-mono bg-black/70 border-white/20 text-white backdrop-blur-sm">
                              {preset.badge}
                            </Badge>
                            {isSelected && (
                              <div className="relative z-10 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(167,139,250,0.8)]">
                                <Check size={12} weight="bold" />
                              </div>
                            )}
                          </div>

                          {/* Conteúdo */}
                          <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">
                                {preset.name}
                              </h3>
                              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal mt-1">
                                {preset.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/8">
                              <span>Slideshow 10s · 0% GPU</span>
                              <span className="text-[10px] font-semibold text-purple-300 font-mono">
                                {isSelected ? "● ATIVO" : "Ativar ➜"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
