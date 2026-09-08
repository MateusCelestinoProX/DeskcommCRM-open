"use client";

import * as React from "react";

export type ResolvedTheme =
  | "light"
  | "dark"
  | "ultra-black"
  | "cyberpunk-neon"
  | "midnight-tokyo"
  | "emerald-matrix"
  | "nordic-frost"
  | "sunset-horizon"
  | "luxury-gold"
  | "monokai-pro"
  // Novos Temas Claros
  | "light-sand"
  | "light-ocean"
  | "light-emerald"
  | "light-lavender"
  | "light-rose"
  | "light-nordic"
  | "light-amber"
  // Novos Temas Escuros / Vivos
  | "deep-crimson"
  | "neon-dracula"
  | "solar-flare"
  | "deep-sapphire"
  | "coffee-mocha"
  | "mcp-os-multi";

export type Theme = ResolvedTheme | "system";

export interface ThemePreset {
  id: ResolvedTheme;
  name: string;
  category: "Dark & OLED" | "Cyber & Neon" | "Elegantes" | "Claros";
  description: string;
  badge?: string;
  colors: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
    accentGlow?: string;
  };
  isDark: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "mcp-os-multi",
    name: "MCP OS Multi",
    category: "Cyber & Neon",
    description: "Meta theme inspirado no MCP OS com Liquid Glass ultratranslúcido e 13 backgrounds WebGL cinematográficos em todas as telas.",
    badge: "Meta WebGL",
    colors: {
      bg: "#040407",
      surface: "rgba(10, 11, 20, 0.65)",
      border: "rgba(255, 255, 255, 0.13)",
      text: "#ffffff",
      accent: "#a78bfa",
      accentGlow: "rgba(167, 139, 250, 0.35)",
    },
    isDark: true,
  },

  // --- CLAROS ---
  {
    id: "light",
    name: "Clássico Clean",
    category: "Claros",
    description: "Visual clean e moderno com fundo off-white, tipografia refinada e excelente legibilidade sob luz natural.",
    colors: {
      bg: "#faf9f6",
      surface: "#ffffff",
      border: "#e2e1db",
      text: "#1c1a16",
      accent: "#506d48",
    },
    isDark: false,
  },
  {
    id: "light-sand",
    name: "Duna do Deserto",
    category: "Claros",
    description: "Tons terrosos quentes e aconchegantes de areia dourada e linho com acentos em âmbar caramelo.",
    badge: "Warm Sand",
    colors: {
      bg: "#fdfbf7",
      surface: "#f5efe6",
      border: "#e6dcce",
      text: "#292524",
      accent: "#d97706",
      accentGlow: "rgba(217, 119, 6, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-ocean",
    name: "Brisa Oceânica",
    category: "Claros",
    description: "Fundo cristalino refrescante com azul atlântico e superfícies suaves de alta nitidez diurna.",
    badge: "Ocean Breeze",
    colors: {
      bg: "#f0f7ff",
      surface: "#e0effe",
      border: "#bae0fd",
      text: "#0f172a",
      accent: "#0284c7",
      accentGlow: "rgba(2, 132, 199, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-emerald",
    name: "Jardim Botânico",
    category: "Claros",
    description: "Menta fresca e verde sálvia botânico, projetado para reduzir o estresse ocular em jornadas longas.",
    badge: "Botanical",
    colors: {
      bg: "#f2fbf5",
      surface: "#e1f6eb",
      border: "#c3edd7",
      text: "#064e3b",
      accent: "#059669",
      accentGlow: "rgba(5, 150, 105, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-lavender",
    name: "Lavanda Francesa",
    category: "Claros",
    description: "Tons pastel de lilás, orquídea e névoa floral suave com acentos em violeta contemporâneo.",
    badge: "Lilac Modern",
    colors: {
      bg: "#faf7fe",
      surface: "#f2eafd",
      border: "#e2d4f8",
      text: "#2e1065",
      accent: "#7c3aed",
      accentGlow: "rgba(124, 58, 237, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-rose",
    name: "Rosa Quartz & Coral",
    category: "Claros",
    description: "Estética calorosa e sofisticada em tons de quartzo rosado com acentos em framboesa coral.",
    badge: "Quartz & Coral",
    colors: {
      bg: "#fff5f6",
      surface: "#ffe8eb",
      border: "#fecdd3",
      text: "#4c0519",
      accent: "#e11d48",
      accentGlow: "rgba(225, 29, 72, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-nordic",
    name: "Ártico Minimalista",
    category: "Claros",
    description: "Design escandinavo em ardósia fria ultra-limpa e moderna com acentos em azul cobalto.",
    badge: "Nordic Clean",
    colors: {
      bg: "#f8fafc",
      surface: "#f1f5f9",
      border: "#cbd5e1",
      text: "#0f172a",
      accent: "#2563eb",
      accentGlow: "rgba(37, 99, 235, 0.2)",
    },
    isDark: false,
  },
  {
    id: "light-amber",
    name: "Sol da Manhã",
    category: "Claros",
    description: "Fundo marfim acolhedor iluminado por luz solar suave e refinados acentos dourados.",
    badge: "Morning Glow",
    colors: {
      bg: "#fefdf5",
      surface: "#fef8d8",
      border: "#fef08a",
      text: "#422006",
      accent: "#ca8a04",
      accentGlow: "rgba(202, 138, 4, 0.2)",
    },
    isDark: false,
  },

  // --- ESCUROS & OLED ---
  {
    id: "dark",
    name: "Carbon Greige",
    category: "Dark & OLED",
    description: "Tema escuro neutro com tons de carvão e acentos em verde oliva sálvia suave.",
    colors: {
      bg: "#161510",
      surface: "#1d1c17",
      border: "#33312a",
      text: "#f5f4ef",
      accent: "#82a077",
    },
    isDark: true,
  },
  {
    id: "ultra-black",
    name: "OLED True Black",
    category: "Dark & OLED",
    description: "Super Black 100% puro com alto contraste elétrico para telas AMOLED.",
    badge: "OLED 100%",
    colors: {
      bg: "#000000",
      surface: "#080808",
      border: "#27272a",
      text: "#ffffff",
      accent: "#ffffff",
      accentGlow: "rgba(255, 255, 255, 0.3)",
    },
    isDark: true,
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    category: "Dark & OLED",
    description: "Azul escuro glacial e superfícies polares limpas com acentos em azul celeste ártico.",
    colors: {
      bg: "#0b1324",
      surface: "#111d35",
      border: "#1e3156",
      text: "#f0f9ff",
      accent: "#38bdf8",
      accentGlow: "rgba(56, 189, 248, 0.3)",
    },
    isDark: true,
  },
  {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    category: "Dark & OLED",
    description: "Gradiente de crepúsculo escuro com superfícies em bronze profundo e acentos em laranja solar.",
    colors: {
      bg: "#140d0a",
      surface: "#201410",
      border: "#3a231b",
      text: "#fff7ed",
      accent: "#f97316",
      accentGlow: "rgba(249, 115, 22, 0.35)",
    },
    isDark: true,
  },
  {
    id: "deep-sapphire",
    name: "Sapphire Abyss",
    category: "Dark & OLED",
    description: "Azul marinho abissal profundo com superfícies noturnas e acentos em safira cobalto brilhante.",
    badge: "Deep Abyss",
    colors: {
      bg: "#040814",
      surface: "#0a1124",
      border: "#142247",
      text: "#eff6ff",
      accent: "#3b82f6",
      accentGlow: "rgba(59, 130, 246, 0.35)",
    },
    isDark: true,
  },

  // --- CYBER & NEON ---
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk 2077",
    category: "Cyber & Neon",
    description: "Fundo obsidiana com acentos elétricos em Ciano Neon e detalhes em Magenta Laser.",
    badge: "Neon Vibe",
    colors: {
      bg: "#08090d",
      surface: "#0f111a",
      border: "#1c2233",
      text: "#e6f1ff",
      accent: "#00f0ff",
      accentGlow: "rgba(0, 240, 255, 0.35)",
    },
    isDark: true,
  },
  {
    id: "midnight-tokyo",
    name: "Midnight Tokyo",
    category: "Cyber & Neon",
    description: "Fundo roxo cósmico noturno com realces em violeta elétrico e lavanda luminescente.",
    badge: "Synthwave",
    colors: {
      bg: "#0c0915",
      surface: "#151024",
      border: "#271c42",
      text: "#f3e8ff",
      accent: "#a855f7",
      accentGlow: "rgba(168, 85, 247, 0.35)",
    },
    isDark: true,
  },
  {
    id: "emerald-matrix",
    name: "Matrix Emerald",
    category: "Cyber & Neon",
    description: "Tons profundos de ardósia verde com acentos verdes fosforescentes inspirados na Matrix.",
    badge: "Matrix Code",
    colors: {
      bg: "#05120e",
      surface: "#0b1f18",
      border: "#143328",
      text: "#ecfdf5",
      accent: "#10b981",
      accentGlow: "rgba(16, 185, 129, 0.35)",
    },
    isDark: true,
  },
  {
    id: "deep-crimson",
    name: "Crimson Eclipse",
    category: "Cyber & Neon",
    description: "Fundo vinho carmesim abissal com detalhes em vermelho rubi fluorescente inspirado em eclipses lunares.",
    badge: "Blood Moon",
    colors: {
      bg: "#120407",
      surface: "#1c090e",
      border: "#3d121c",
      text: "#fff1f2",
      accent: "#f43f5e",
      accentGlow: "rgba(244, 63, 94, 0.35)",
    },
    isDark: true,
  },
  {
    id: "neon-dracula",
    name: "Dracula Gothic",
    category: "Cyber & Neon",
    description: "Clássico roxo vampiro gótico com detalhes em fúcsia/magenta neon hipnotizante.",
    badge: "Vampire Gothic",
    colors: {
      bg: "#191a24",
      surface: "#21222c",
      border: "#3a3d52",
      text: "#f8f8f2",
      accent: "#ff79c6",
      accentGlow: "rgba(255, 121, 198, 0.35)",
    },
    isDark: true,
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    category: "Cyber & Neon",
    description: "Carvão vulcânico aquecido com plasma laranja incandescente e erupções solares energéticas.",
    badge: "Solar Plasma",
    colors: {
      bg: "#140d07",
      surface: "#1f140a",
      border: "#42240f",
      text: "#fff7ed",
      accent: "#ff6b00",
      accentGlow: "rgba(255, 107, 0, 0.35)",
    },
    isDark: true,
  },

  // --- ELEGANTES & PRO ---
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    category: "Elegantes",
    description: "Preto caviar nobre com acabamento requintado em ouro champanhe acetinado.",
    badge: "Premium VIP",
    colors: {
      bg: "#0c0c0c",
      surface: "#151515",
      border: "#2b261b",
      text: "#fbf8f0",
      accent: "#d4af37",
      accentGlow: "rgba(212, 175, 55, 0.3)",
    },
    isDark: true,
  },
  {
    id: "monokai-pro",
    name: "Monokai Pro",
    category: "Elegantes",
    description: "Paleta clássica para desenvolvedores com fundo café torrado e acentos em amarelo canário.",
    badge: "Pro Dev",
    colors: {
      bg: "#19181a",
      surface: "#222125",
      border: "#343238",
      text: "#fcfcfa",
      accent: "#ffd866",
      accentGlow: "rgba(255, 216, 102, 0.3)",
    },
    isDark: true,
  },
  {
    id: "coffee-mocha",
    name: "Mocha Espresso",
    category: "Elegantes",
    description: "Café torrado espresso com acabamento aveludado e acentos quentes em caramelo queimado.",
    badge: "Velvet Cafe",
    colors: {
      bg: "#140f0c",
      surface: "#1d1713",
      border: "#3b2c24",
      text: "#fbf7f3",
      accent: "#d97706",
      accentGlow: "rgba(217, 119, 6, 0.3)",
    },
    isDark: true,
  },
];

const VALID_THEMES = new Set<string>([
  "light",
  "dark",
  "ultra-black",
  "cyberpunk-neon",
  "midnight-tokyo",
  "emerald-matrix",
  "nordic-frost",
  "sunset-horizon",
  "luxury-gold",
  "monokai-pro",
  // Novos temas claros
  "light-sand",
  "light-ocean",
  "light-emerald",
  "light-lavender",
  "light-rose",
  "light-nordic",
  "light-amber",
  // Novos temas escuros / vivos
  "deep-crimson",
  "neon-dracula",
  "solar-flare",
  "deep-sapphire",
  "coffee-mocha",
  "mcp-os-multi",
  "system",
]);

const STORAGE_KEY = "deskcomm-theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && VALID_THEMES.has(v)) return v as Theme;
  } catch {
    // localStorage indisponível
  }
  return "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme());
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  React.useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggle = React.useCallback(() => {
    setThemeState((current) => {
      const currentResolved =
        current === "system" ? getSystemTheme() : current;
      const allIds = THEME_PRESETS.map((p) => p.id);
      const currentIndex = allIds.indexOf(currentResolved);
      const nextIndex = (currentIndex + 1) % allIds.length;
      const nextTheme = allIds[nextIndex] || "dark";

      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // ignore
      }
      return nextTheme;
    });
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}
