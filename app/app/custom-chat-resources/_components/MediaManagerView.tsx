"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UploadSimple,
  Microphone,
  Image as ImageIcon,
  FileText,
  VideoCamera,
  Trash,
  Play,
  Pause,
  PaperPlaneTilt,
  CalendarBlank,
  CheckCircle,
  ArrowsClockwise,
  FolderSimple,
} from "@/lib/ui/icons";
import { CustomMediaItem } from "@/lib/custom-chat/media-store";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";

interface MediaManagerViewProps {
  onSelectForDisparador?: (media: MediaAttachment) => void;
  onSelectForAgendador?: (media: MediaAttachment) => void;
}

export function MediaManagerView({
  onSelectForDisparador,
  onSelectForAgendador,
}: MediaManagerViewProps) {
  const t = useT();

  const [mediaList, setMediaList] = React.useState<CustomMediaItem[]>([]);
  const [filterType, setFilterType] = React.useState<"all" | "image" | "audio" | "video" | "document">("all");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);

  // Gravador de Áudio no Navegador
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState<number>(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Áudio Player Simulado
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null);

  // Carrega lista de mídias salvas
  const fetchMedia = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/custom-chat/media");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setMediaList(json.data);
      }
    } catch {
      // Ignora falha inicial
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Upload direto de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedbackMsg(null);

    let type: "image" | "audio" | "video" | "document" = "document";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("audio/")) type = "audio";
    else if (file.type.startsWith("video/")) type = "video";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("name", file.name);
    if (type === "audio") {
      formData.append("isRecordedVoice", "true");
    }

    try {
      const res = await fetch("/api/v1/custom-chat/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.ok) {
        setFeedbackMsg(t("Mídia enviada com sucesso para a biblioteca!"));
        await fetchMedia();
      } else {
        setFeedbackMsg(json.error || t("Falha no upload"));
      }
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : t("Falha de rede"));
    } finally {
      setIsUploading(false);
    }
  };

  // Gravação de Áudio ao vivo no microfone
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg; codecs=opus" });
        const file = new File([audioBlob], `Voz_Gravada_Na_Hora_${Date.now()}.ogg`, {
          type: "audio/ogg",
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "audio");
        formData.append("isRecordedVoice", "true");
        formData.append("name", `Nota de Voz (PTT Gravada na Hora)`);

        setIsUploading(true);
        try {
          const res = await fetch("/api/v1/custom-chat/media", {
            method: "POST",
            body: formData,
          });
          const json = await res.json();
          if (json.ok) {
            setFeedbackMsg(t("Áudio gravado na hora salvo com sucesso!"));
            await fetchMedia();
          }
        } catch {
          // Erro de salvamento
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert(t("Permissão para acessar microfone foi negada ou não está disponível."));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Exclusão de mídia
  const handleDeleteMedia = async (id: string) => {
    if (!confirm(t("Deseja realmente remover esta mídia da biblioteca?"))) return;
    try {
      const res = await fetch(`/api/v1/custom-chat/media?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      alert(t("Erro ao excluir mídia"));
    }
  };

  const filteredMedia = React.useMemo(() => {
    if (filterType === "all") return mediaList;
    return mediaList.filter((m) => m.type === filterType);
  }, [mediaList, filterType]);

  return (
    <div className="space-y-6">
      {/* Banner da Central de Mídias */}
      <div className="p-5 rounded-xl bg-black border border-white/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/15 text-white">
            <FolderSimple size={26} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                {t("Central de Mídias e Conteúdos")}
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                {t("Áudios Gravados na Hora (PTT)")}
              </Badge>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {t("Faça upload direto de imagens, vídeos, documentos e áudios de voz para usar em disparos e sequências.")}
            </p>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
            <span className="text-white/60">{t("Total armazenado:")}</span>
            <span className="text-white font-bold">{mediaList.length}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMedia}
            disabled={isLoading}
            className="border-white/20 text-white hover:bg-white/10 h-8 gap-1.5 text-xs"
          >
            <ArrowsClockwise size={13} className={isLoading ? "animate-spin" : ""} />
            {t("Atualizar")}
          </Button>
        </div>
      </div>

      {/* Grid: Seção de Upload & Gravador de Voz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Upload Direto de Arquivos */}
        <div className="p-5 rounded-xl bg-black border border-white/20 shadow-xl space-y-4">
          <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UploadSimple size={18} />
            {t("Upload Direto de Mídias")}
          </Label>
          <p className="text-xs text-white/60">
            {t("Selecione arquivos de imagem (PNG, JPG), áudio (MP3, OGG, WAV), vídeos ou PDFs do seu computador.")}
          </p>

          <div className="relative border-2 border-dashed border-white/20 hover:border-white/50 rounded-xl p-6 text-center transition-colors">
            <input
              type="file"
              disabled={isUploading}
              onChange={handleFileUpload}
              accept="image/*,audio/*,video/*,application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <UploadSimple size={32} className="text-white/70" />
              <p className="text-xs font-semibold text-white">
                {isUploading ? t("Processando upload...") : t("Clique ou arraste um arquivo para cá")}
              </p>
              <span className="text-[10px] text-white/50">
                {t("PNG, JPG, MP4, MP3, OGG, PDF (Até 50MB)")}
              </span>
            </div>
          </div>

          {feedbackMsg && (
            <p className="text-xs font-mono text-emerald-400 text-center">{feedbackMsg}</p>
          )}
        </div>

        {/* Card 2: Gravador de Voz na Hora (PTT Nativo) */}
        <div className="p-5 rounded-xl bg-black border border-white/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Microphone size={18} className="text-emerald-400" />
              {t("Gravar Áudio na Hora (PTT)")}
            </Label>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
              {t("Microfone Verde")}
            </Badge>
          </div>
          <p className="text-xs text-white/60">
            {t("Grave sua voz pelo microfone. No WhatsApp do cliente, será entregue como se você estivesse gravando naquele exato instante.")}
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-3">
            {isRecording ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="font-mono text-sm font-bold text-red-400">
                    {t("Gravando...")} {recordingSeconds}s
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleStopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold gap-2 text-xs"
                >
                  <Pause size={14} weight="bold" />
                  {t("Concluir e Salvar na Central")}
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black tracking-wide text-xs py-5 gap-2"
              >
                <Microphone size={18} weight="bold" />
                {t("Iniciar Gravação com Microfone")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Galeria de Mídias com Abas de Filtro */}
      <div className="p-5 rounded-xl bg-black border border-white/20 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <Label className="text-sm font-bold text-white uppercase tracking-wider">
            {t("Mídias Disponíveis no Sistema")}
          </Label>

          {/* Filtros */}
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: t("Todas") },
              { id: "image", label: t("Imagens") },
              { id: "audio", label: t("Áudios PTT") },
              { id: "video", label: t("Vídeos") },
              { id: "document", label: t("Documentos") },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterType === f.id
                    ? "bg-white text-black border-white shadow"
                    : "bg-black text-white/70 border-white/15 hover:border-white/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Cards de Mídia */}
        {filteredMedia.length === 0 ? (
          <div className="py-12 text-center text-white/50 space-y-2">
            <FolderSimple size={36} className="mx-auto opacity-40" />
            <p className="text-xs">{t("Nenhuma mídia encontrada nesta categoria.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white/5 border border-white/15 hover:border-white/30 transition-all flex flex-col justify-between space-y-3 shadow-lg"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {item.type === "image" && <ImageIcon size={18} className="text-blue-400 shrink-0" />}
                    {item.type === "audio" && <Microphone size={18} className="text-emerald-400 shrink-0" />}
                    {item.type === "video" && <VideoCamera size={18} className="text-purple-400 shrink-0" />}
                    {item.type === "document" && <FileText size={18} className="text-red-400 shrink-0" />}
                    <span className="font-semibold text-xs text-white truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="text-white/40 hover:text-red-400 hover:bg-white/10 h-7 w-7 p-0 shrink-0"
                    title={t("Excluir Mídia")}
                  >
                    <Trash size={14} />
                  </Button>
                </div>

                {/* Preview da Mídia */}
                <div className="rounded-lg bg-black/60 border border-white/10 p-2 overflow-hidden flex items-center justify-center min-h-[110px]">
                  {item.type === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.dataUrl || item.url}
                      alt={item.name}
                      className="max-h-24 object-contain rounded"
                    />
                  )}

                  {item.type === "audio" && (
                    <div className="w-full space-y-2 p-1">
                      <audio
                        id={`audio-${item.id}`}
                        src={item.dataUrl || item.url}
                        onEnded={() => setPlayingAudioId(null)}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`audio-${item.id}`) as HTMLAudioElement | null;
                            if (playingAudioId === item.id) {
                              el?.pause();
                              setPlayingAudioId(null);
                            } else {
                              document.querySelectorAll("audio").forEach((a) => a.pause());
                              el?.play().then(() => setPlayingAudioId(item.id)).catch(() => setPlayingAudioId(item.id));
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-[#25d366] text-black flex items-center justify-center hover:scale-105 shadow-md cursor-pointer"
                        >
                          {playingAudioId === item.id ? (
                            <Pause size={14} weight="bold" />
                          ) : (
                            <Play size={14} weight="bold" className="ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-0.5 h-4">
                            {[4, 10, 14, 8, 16, 12, 6, 14, 10, 8, 12, 16, 6].map((h, idx) => (
                              <span
                                key={idx}
                                className={`w-[2px] rounded-full transition-all ${
                                  playingAudioId === item.id ? "bg-[#25d366]" : "bg-white/50"
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                          <p className="text-[9px] text-emerald-400 font-mono">
                            {t("Gravado na hora • PTT WhatsApp")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {item.type === "video" && (
                    <video
                      src={item.dataUrl || item.url}
                      controls
                      playsInline
                      className="max-h-28 max-w-full rounded object-contain bg-black"
                    />
                  )}

                  {item.type === "document" && (
                    <div className="flex flex-col items-center text-white/70 space-y-1">
                      <FileText size={28} className="text-red-400" />
                      <span className="text-[10px] font-mono">PDF / Documento</span>
                    </div>
                  )}
                </div>

                {/* Badges de Metadados */}
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>{(item.sizeBytes / 1024).toFixed(0)} KB</span>
                  {item.isRecordedVoice && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] py-0">
                      {t("PTT Ativo")}
                    </Badge>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onSelectForDisparador?.({
                        type: item.type,
                        url: item.url,
                        dataUrl: item.dataUrl,
                        filename: item.name,
                        mimetype: item.mimetype,
                        isRecordedVoice: item.isRecordedVoice,
                      })
                    }
                    className="h-8 text-xs border-white/20 text-white hover:bg-white/10 gap-1"
                  >
                    <PaperPlaneTilt size={13} />
                    {t("No Disparador")}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onSelectForAgendador?.({
                        type: item.type,
                        url: item.url,
                        dataUrl: item.dataUrl,
                        filename: item.name,
                        mimetype: item.mimetype,
                        isRecordedVoice: item.isRecordedVoice,
                      })
                    }
                    className="h-8 text-xs border-white/20 text-white hover:bg-white/10 gap-1"
                  >
                    <CalendarBlank size={13} />
                    {t("No Agendador")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
