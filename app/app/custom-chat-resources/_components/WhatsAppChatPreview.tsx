"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  FileText,
  ArrowsClockwise,
  Check,
  User,
  Microphone,
  Image as ImageIcon,
  VideoCamera,
} from "@/lib/ui/icons";
import { ContactRecipient, generateUniqueMessage } from "@/lib/custom-chat/spintax";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";

interface WhatsAppChatPreviewProps {
  messageTemplate: string;
  recipients: ContactRecipient[];
  testRecipient?: ContactRecipient;
  media?: MediaAttachment;
  activeSessionPhone?: string;
}

export function WhatsAppChatPreview({
  messageTemplate,
  recipients,
  testRecipient,
  media,
  activeSessionPhone,
}: WhatsAppChatPreviewProps) {
  const t = useT();

  // Lista de opções de contatos para simulação
  const availableRecipients = React.useMemo(() => {
    const list: ContactRecipient[] = [];
    if (testRecipient) {
      list.push(testRecipient);
    }
    if (recipients.length > 0) {
      list.push(...recipients.slice(0, 5));
    }
    if (list.length === 0) {
      list.push({
        raw: "+5531998622489",
        primeiroNome: "Carlos",
        segundoNome: "Eduardo",
        nomeCompleto: "Carlos Eduardo",
        customTexto: "Cliente VIP",
        numero: "5531998622489",
        numeroLimpo: "5531998622489",
        numeroFormatado: "+55 31 99862-2489",
      });
    }
    return list;
  }, [recipients, testRecipient]);

  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);
  const [randomSeed, setRandomSeed] = React.useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = React.useState<boolean>(false);
  const [audioDuration, setAudioDuration] = React.useState<number>(15);
  const [audioCurrentTime, setAudioCurrentTime] = React.useState<number>(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = React.useState<string>("21:30");

  const togglePlayAudio = () => {
    if (!audioRef.current) {
      setIsPlayingAudio((p) => !p);
      return;
    }
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(true));
    }
  };

  const formatAudioSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  React.useEffect(() => {
    const now = new Date();
    setCurrentTimeStr(
      now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    );
  }, []);

  const activeContact = availableRecipients[selectedIdx] || availableRecipients[0];

  // Gera a mensagem exata resolvida para o contato atual
  const resolvedText = React.useMemo(() => {
    if (!activeContact) return "";
    return generateUniqueMessage(messageTemplate, activeContact);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageTemplate, activeContact, randomSeed]);

  return (
    <div className="rounded-2xl border border-white/20 bg-black overflow-hidden shadow-2xl flex flex-col">
      {/* Barra de Controle da Prévia */}
      <div className="p-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase font-bold tracking-wider">
            {t("Simulação Exata WhatsApp")}
          </Badge>
          <span className="text-xs text-white/70">
            {t("O que você vê aqui é o que o cliente receberá:")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Contato Simulado */}
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="bg-black border border-white/20 text-white rounded-md text-xs h-7 px-2 focus:outline-none focus:border-white font-mono"
          >
            {availableRecipients.map((rec, i) => (
              <option key={i} value={i}>
                {rec.nomeCompleto} ({rec.numeroFormatado || rec.numero})
              </option>
            ))}
          </select>

          {/* Botão Regerar Variação Spintax */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRandomSeed((s) => s + 1)}
            title={t("Regerar variação de Spintax")}
            className="h-7 px-2.5 text-xs border-white/20 text-white hover:bg-white/10 gap-1"
          >
            <ArrowsClockwise size={12} />
            {t("Regerar")}
          </Button>
        </div>
      </div>

      {/* Frame do Chat WhatsApp Mobile */}
      <div className="max-w-[420px] w-full mx-auto my-4 rounded-3xl overflow-hidden border border-white/25 shadow-2xl flex flex-col bg-[#0b141a]">
        {/* Topbar WhatsApp */}
        <div className="bg-[#1f2c34] px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center text-white/70 border border-white/10">
                <User size={22} weight="bold" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#1f2c34]" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#e9edef] leading-tight">
                {activeContact?.nomeCompleto || t("Destinatário")}
              </h4>
              <p className="text-[11px] text-[#8696a0] flex items-center gap-1">
                <span>online</span>
                {activeSessionPhone && (
                  <span className="text-[10px] text-white/40 font-mono">
                    • {t("via")} +{activeSessionPhone}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#8696a0]">
            <VideoCamera size={18} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0]" />
          </div>
        </div>

        {/* Fundo do Chat com Padrão Sutil */}
        <div
          className="p-4 min-h-[340px] flex flex-col justify-end space-y-3 relative"
          style={{
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            backgroundColor: "#0b141a",
          }}
        >
          {/* Badge de Data Centralizada estilo WhatsApp */}
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-lg bg-[#182229]/90 text-[11px] text-[#8696a0] shadow">
              {t("Hoje")}
            </span>
          </div>

          {/* Balão de Mensagem de Envio (Direita / Balão Verde WhatsApp) */}
          <div className="flex flex-col items-end">
            <div className="relative max-w-[85%] rounded-2xl rounded-tr-xs bg-[#005c4b] text-[#e9edef] shadow-md overflow-hidden text-sm">
              {/* 1. Mídia: Imagem */}
              {media && media.type === "image" && (
                <div className="p-1 pb-0">
                  {media.url || media.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media.dataUrl || media.url}
                      alt="Anexo"
                      className="w-full max-h-56 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-40 bg-[#025143] rounded-xl flex items-center justify-center text-white/60">
                      <ImageIcon size={36} />
                    </div>
                  )}
                </div>
              )}

              {/* 2. Mídia: Áudio PTT (Nota de Voz gravada na hora com microfone verde) */}
              {media && media.type === "audio" && (
                <div className="p-3 pb-1 flex items-center gap-3">
                  {/* Tag de áudio invisível para reprodução real */}
                  {(media.dataUrl || media.url) && (
                    <audio
                      ref={audioRef}
                      src={media.dataUrl || media.url}
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur && !isNaN(dur) && dur > 0) setAudioDuration(dur);
                      }}
                      onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
                      onEnded={() => {
                        setIsPlayingAudio(false);
                        setAudioCurrentTime(0);
                      }}
                    />
                  )}

                  {/* Foto de perfil com badge de microfone verde */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-[#182229] flex items-center justify-center text-white/70 border border-white/10">
                      <User size={20} />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25d366] flex items-center justify-center text-black shadow-sm">
                      <Microphone size={10} weight="bold" />
                    </div>
                  </div>

                  {/* Play/Pause e Waveform */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        title={isPlayingAudio ? t("Pausar Áudio") : t("Ouvir Áudio")}
                        className="w-8 h-8 rounded-full bg-[#25d366] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        {isPlayingAudio ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" className="ml-0.5" />}
                      </button>

                      {/* Waveform simulada autêntica com progresso sincronizado */}
                      <div className="flex items-center gap-0.5 flex-1 h-6 cursor-pointer" onClick={togglePlayAudio}>
                        {[4, 8, 14, 10, 16, 20, 12, 18, 22, 16, 12, 8, 14, 18, 10, 6, 12, 16, 8, 4].map(
                          (h, idx) => {
                            const progressRatio = audioDuration > 0 ? audioCurrentTime / audioDuration : 0;
                            const barRatio = idx / 20;
                            const isPast = progressRatio >= barRatio;
                            return (
                              <span
                                key={idx}
                                className={`w-[2.5px] rounded-full transition-all duration-150 ${
                                  isPast ? "bg-[#25d366]" : "bg-white/60"
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-white/70 font-mono pl-10">
                      <span>{formatAudioSecs(isPlayingAudio ? audioCurrentTime : audioDuration)}</span>
                      <span className="text-emerald-300 text-[9px] font-sans font-medium">
                        {t("Nota de voz gravada na hora (PTT)")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Mídia: Vídeo */}
              {media && media.type === "video" && (
                <div className="p-1 pb-0 relative">
                  {media.dataUrl || media.url ? (
                    <video
                      src={media.dataUrl || media.url}
                      controls
                      playsInline
                      className="w-full max-h-60 rounded-xl bg-black object-contain shadow-inner"
                    />
                  ) : (
                    <div className="w-full h-44 bg-[#025143] rounded-xl flex flex-col items-center justify-center text-white/80">
                      <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                        <Play size={20} weight="bold" className="text-white ml-0.5" />
                      </div>
                      <span className="text-[11px] text-white/70 mt-2 font-mono">
                        {t("0:28 • Vídeo MP4")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Mídia: Documento */}
              {media && media.type === "document" && (
                <div className="p-2 pb-0">
                  <div className="p-2.5 rounded-xl bg-[#025143] flex items-center gap-3 border border-white/10">
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-300">
                      <FileText size={22} weight="bold" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">
                        {media.filename || "Documento_Anexo.pdf"}
                      </p>
                      <p className="text-[10px] text-white/50">PDF • 1.2 MB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Texto da Mensagem */}
              {resolvedText && (
                <div className="px-3 pt-2 pb-1.5 whitespace-pre-wrap font-sans text-xs leading-relaxed break-words">
                  {resolvedText}
                </div>
              )}

              {/* Legenda se houver mídia sem texto principal */}
              {!resolvedText && media?.caption && (
                <div className="px-3 pt-1 pb-1.5 whitespace-pre-wrap font-sans text-xs leading-relaxed break-words">
                  {media.caption}
                </div>
              )}

              {/* Rodapé do Balão: Horário e Duplo Check Azul */}
              <div className="flex items-center justify-end gap-1 px-2.5 pb-1 text-[10px] text-[#8696a0]">
                <span>{currentTimeStr}</span>
                <span className="flex items-center text-[#53bdeb] font-bold" title="Lida">
                  <Check size={12} weight="bold" />
                  <Check size={12} weight="bold" className="-ml-1.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
