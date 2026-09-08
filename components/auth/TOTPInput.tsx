"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";

interface TOTPInputProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Visual hint for invalid state. */
  hasError?: boolean;
  className?: string;
}

const LENGTH = 6;

/**
 * Input TOTP de 6 dígitos com design premium:
 * - Divisão 3x3 com separador central elegante (estilo Apple/GitHub)
 * - Navegação por setas, backspace inteligente e colar código completo
 * - Transições suaves de foco e validação com realce de borda
 */
export function TOTPInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
  hasError,
  className,
}: TOTPInputProps) {
  const t = useT();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [chars, setChars] = useState<string[]>(() =>
    Array.from({ length: LENGTH }, (_, i) => value[i] ?? ""),
  );

  useEffect(() => {
    setChars(Array.from({ length: LENGTH }, (_, i) => value[i] ?? ""));
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      inputs.current[0]?.focus();
    }
  }, [autoFocus]);

  const commit = (next: string[]) => {
    setChars(next);
    const joined = next.join("");
    onChange(joined);
    if (joined.length === LENGTH && next.every((c) => c !== "") && onComplete) {
      onComplete(joined);
    }
  };

  const handleChange = (i: number, raw: string) => {
    // Apenas dígitos numéricos
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit && raw.length > 0) return;
    const next = [...chars];
    next[i] = digit;
    commit(next);
    if (digit && i < LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (chars[i]) {
        const next = [...chars];
        next[i] = "";
        commit(next);
        return;
      }
      if (i > 0) {
        inputs.current[i - 1]?.focus();
        const next = [...chars];
        next[i - 1] = "";
        commit(next);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: LENGTH }, (_, i) => text[i] ?? "");
    commit(next);
    const lastIdx = Math.min(text.length, LENGTH - 1);
    inputs.current[lastIdx]?.focus();
  };

  return (
    <div
      className={cn("flex items-center justify-center gap-1.5 sm:gap-2.5", className)}
      role="group"
      aria-label={t("Código de 6 dígitos")}
    >
      {chars.map((c, i) => (
        <div key={i} className="flex items-center">
          {i === 3 && (
            <span
              className="mx-1 h-1 w-2 rounded-full bg-muted-foreground/30 sm:mx-1.5 sm:w-3"
              aria-hidden="true"
            />
          )}
          <input
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={c}
            disabled={disabled}
            aria-invalid={hasError ? true : undefined}
            aria-label={`${t("Dígito")} ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "h-13 w-10.5 sm:h-15 sm:w-13 rounded-xl border-2 text-center font-mono text-xl sm:text-2xl font-bold tabular-nums",
              "bg-surface/60 text-foreground transition-all duration-150 outline-none shadow-xs",
              "border-border/80 hover:border-border-strong",
              "focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/15 focus:scale-[1.03]",
              c !== "" && "border-primary/50 bg-primary/5",
              hasError && "border-destructive/80 bg-destructive/5 text-destructive focus:border-destructive focus:ring-destructive/20",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>
      ))}
    </div>
  );
}
