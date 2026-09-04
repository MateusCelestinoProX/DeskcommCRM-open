/**
 * Gerenciador de Mídias para Custom Chat Resources
 * Suporta imagens, áudios PTT gravados na hora, vídeos e documentos.
 */

import fs from "node:fs";
import path from "node:path";
import { logger } from "@/lib/logger";

export interface CustomMediaItem {
  id: string;
  name: string;
  type: "image" | "audio" | "video" | "document";
  url: string;
  dataUrl?: string; // Base64 para envio direto via WAHA
  mimetype: string;
  sizeBytes: number;
  durationSeconds?: number;
  isRecordedVoice?: boolean; // Se foi gravado na hora como PTT
  createdAt: string;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "custom-chat");
const STORE_FILE = path.join(process.cwd(), "lib", "custom-chat", "media-data.json");

// Garante existência dos diretórios
function ensureDirectories() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    logger.warn("[media-store] Erro ao criar diretório de uploads", { err });
  }
}

// Mídias seed iniciais para demonstração e uso imediato
const SEED_MEDIA: CustomMediaItem[] = [
  {
    id: "media_audio_seed_1",
    name: "Apresentacao_Voz_Diretoria.ogg",
    type: "audio",
    url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    mimetype: "audio/ogg",
    sizeBytes: 145200,
    durationSeconds: 15,
    isRecordedVoice: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "media_image_seed_2",
    name: "Banner_Lancamento_Exclusivo.png",
    type: "image",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    mimetype: "image/png",
    sizeBytes: 428000,
    isRecordedVoice: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "media_doc_seed_3",
    name: "Catalogo_Servicos_Deskcomm.pdf",
    type: "document",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    mimetype: "application/pdf",
    sizeBytes: 29800,
    isRecordedVoice: false,
    createdAt: new Date().toISOString(),
  },
];

export function getCustomMediaList(): CustomMediaItem[] {
  ensureDirectories();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    logger.warn("[media-store] Falha ao carregar arquivo de mídias", { err });
  }
  return SEED_MEDIA;
}

export function saveCustomMediaItem(item: CustomMediaItem): CustomMediaItem[] {
  ensureDirectories();
  const current = getCustomMediaList();
  const updated = [item, ...current.filter((m) => m.id !== item.id)];
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    logger.warn("[media-store] Falha ao persistir mídia", { err });
  }
  return updated;
}

export function deleteCustomMediaItem(id: string): CustomMediaItem[] {
  const current = getCustomMediaList();
  const target = current.find((m) => m.id === id);
  if (target && target.url.startsWith("/uploads/custom-chat/")) {
    const filename = path.basename(target.url);
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      logger.warn("[media-store] Falha ao deletar arquivo físico", { err });
    }
  }
  const updated = current.filter((m) => m.id !== id);
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    logger.warn("[media-store] Falha ao salvar remoção de mídia", { err });
  }
  return updated;
}
