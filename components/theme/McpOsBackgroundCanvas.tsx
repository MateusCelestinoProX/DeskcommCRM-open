"use client";

import * as React from "react";
import { useTheme } from "@/lib/theme";
import { renderWebGLBackground, stopWebGLBackground } from "@/lib/webgl/mcp-os-backgrounds";
import { IMAGE_GALLERIES, isGalleryPreset } from "@/lib/webgl/mcp-os-galleries";

export const DESKCOMM_BG_STORAGE_KEY = "deskcomm-webgl-bg";
export const DESKCOMM_BG_CHANGE_EVENT = "deskcomm-webgl-bg-change";

export function McpOsBackgroundCanvas() {
  const { resolvedTheme } = useTheme();
  const webglRef = React.useRef<HTMLDivElement>(null);
  const slide1Ref = React.useRef<HTMLDivElement>(null);
  const slide2Ref = React.useRef<HTMLDivElement>(null);

  const [activeBg, setActiveBg] = React.useState<string>(() => {
    if (typeof window === "undefined") return "strands";
    try {
      return window.localStorage.getItem(DESKCOMM_BG_STORAGE_KEY) || "strands";
    } catch {
      return "strands";
    }
  });

  // Estado e refs para controle do slideshow de imagens
  const activeSlideRef = React.useRef<1 | 2>(1);
  const currentImageIndexRef = React.useRef<number>(0);
  const galleryTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Ouvinte de evento customizado para alteração imediata
  React.useEffect(() => {
    const handleBgChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ bg: string }>;
      if (customEvent.detail?.bg) {
        setActiveBg(customEvent.detail.bg);
      }
    };

    window.addEventListener(DESKCOMM_BG_CHANGE_EVENT, handleBgChange);
    return () => {
      window.removeEventListener(DESKCOMM_BG_CHANGE_EVENT, handleBgChange);
    };
  }, []);

  // Gerenciamento dos fundos (WebGL ou Galeria de Imagens)
  React.useEffect(() => {
    if (resolvedTheme !== "mcp-os-multi") {
      if (webglRef.current) {
        stopWebGLBackground(webglRef.current);
      }
      if (galleryTimerRef.current) {
        clearInterval(galleryTimerRef.current);
        galleryTimerRef.current = null;
      }
      return;
    }

    const isImageGallery = isGalleryPreset(activeBg);

    // MODO 1: GALERIA DE IMAGENS DO MCP OS (Crossfade e 0% GPU)
    if (isImageGallery) {
      // 1. Desliga WebGL para economizar GPU
      if (webglRef.current) {
        stopWebGLBackground(webglRef.current);
        webglRef.current.style.display = "none";
      }

      const images = IMAGE_GALLERIES[activeBg] || IMAGE_GALLERIES["gallery-soft"] || [];
      if (images.length === 0) return;

      currentImageIndexRef.current = 0;
      const s1 = slide1Ref.current;
      const s2 = slide2Ref.current;

      if (s1 && s2) {
        s1.style.display = "block";
        s2.style.display = "block";

        // Carrega a primeira foto no slide 1 imediatamente
        const firstImg = images[0];
        if (firstImg) {
          s1.style.backgroundImage = 'url("' + firstImg + '")';
          s1.classList.add("active");
          s2.classList.remove("active");
          activeSlideRef.current = 1;
        }

        if (galleryTimerRef.current) {
          clearInterval(galleryTimerRef.current);
        }

        // Se houver mais de uma foto, roda o slideshow suave a cada 10s
        if (images.length > 1) {
          galleryTimerRef.current = setInterval(() => {
            currentImageIndexRef.current = (currentImageIndexRef.current + 1) % images.length;
            const nextImgUrl = images[currentImageIndexRef.current];
            if (!nextImgUrl) return;

            const currentActive = activeSlideRef.current;
            const targetSlide = currentActive === 1 ? s2 : s1;
            const prevSlide = currentActive === 1 ? s1 : s2;

            // Pré-carrega na memória antes da transição para evitar piscadas
            const preload = new Image();
            preload.src = nextImgUrl;
            preload.onload = () => {
              targetSlide.style.backgroundImage = 'url("' + nextImgUrl + '")';
              targetSlide.classList.add("active");
              prevSlide.classList.remove("active");
              activeSlideRef.current = currentActive === 1 ? 2 : 1;
            };
          }, 10000);
        }
      }

      return () => {
        if (galleryTimerRef.current) {
          clearInterval(galleryTimerRef.current);
          galleryTimerRef.current = null;
        }
      };
    }

    // MODO 2: SHADERS WEBGL EM TEMPO REAL
    // 1. Limpa timers de galeria e esconde slides de fotos
    if (galleryTimerRef.current) {
      clearInterval(galleryTimerRef.current);
      galleryTimerRef.current = null;
    }
    if (slide1Ref.current) slide1Ref.current.style.display = "none";
    if (slide2Ref.current) slide2Ref.current.style.display = "none";

    const container = webglRef.current;
    if (!container) return;
    container.style.display = "block";

    let cleanupFn: (() => void) | null = null;
    try {
      cleanupFn = renderWebGLBackground(container, activeBg);
    } catch (err) {
      console.error("[WebGL Background Error] Falha ao renderizar fundo WebGL:", err);
    }

    return () => {
      if (cleanupFn) {
        try {
          cleanupFn();
        } catch (e) {
          console.error("[WebGL Cleanup Error]", e);
        }
      } else if (container) {
        stopWebGLBackground(container);
      }
    };
  }, [resolvedTheme, activeBg]);

  if (resolvedTheme !== "mcp-os-multi") {
    return null;
  }

  return (
    <div
      id="deskcomm-webgl-root"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {/* Camadas de Slides de Imagens MCP OS com transição crossfade suave */}
      <div
        ref={slide1Ref}
        id="bg-slide-1"
        className="bg-slide absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none"
        style={{ display: "none" }}
      />
      <div
        ref={slide2Ref}
        id="bg-slide-2"
        className="bg-slide absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none"
        style={{ display: "none" }}
      />

      {/* Camada de Canvas WebGL */}
      <div
        id="bg-webgl-container"
        ref={webglRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Camada de Vinheta e Escurecimento Cinematográfico para Alto Contraste */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.25) 100%)",
        }}
      />
    </div>
  );
}
