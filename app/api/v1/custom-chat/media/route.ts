import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  getCustomMediaList,
  saveCustomMediaItem,
  deleteCustomMediaItem,
  CustomMediaItem,
} from "@/lib/custom-chat/media-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const mediaList = getCustomMediaList();
  return NextResponse.json({ ok: true, data: mediaList });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Upload via FormData (arquivo direto)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const type = (formData.get("type") as any) || "image";
      const isRecordedVoice = formData.get("isRecordedVoice") === "true";
      const customName = formData.get("name") as string | null;

      if (!file) {
        return NextResponse.json({ ok: false, error: "Nenhum arquivo enviado." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;

      // Salva arquivo físico na pasta public/uploads/custom-chat
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "custom-chat");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const safeExt = path.extname(file.name) || (type === "audio" ? ".ogg" : type === "image" ? ".png" : ".bin");
      const uniqueFilename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
      const destPath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(destPath, buffer);

      const newItem: CustomMediaItem = {
        id: `med_${Date.now()}`,
        name: customName || file.name || uniqueFilename,
        type: type as any,
        url: `/uploads/custom-chat/${uniqueFilename}`,
        dataUrl,
        mimetype: file.type || "application/octet-stream",
        sizeBytes: buffer.length,
        isRecordedVoice: isRecordedVoice || type === "audio",
        createdAt: new Date().toISOString(),
      };

      const list = saveCustomMediaItem(newItem);
      return NextResponse.json({ ok: true, data: newItem, all: list });
    }

    // 2. Upload via JSON (Base64 ou URL)
    const body = await req.json();
    const { name, type, url, dataUrl, mimetype, sizeBytes, durationSeconds, isRecordedVoice } = body;

    if (!url && !dataUrl) {
      return NextResponse.json(
        { ok: false, error: "Informe a URL ou os dados da mídia." },
        { status: 400 },
      );
    }

    const newItem: CustomMediaItem = {
      id: `med_${Date.now()}`,
      name: name || `Mídia_${Date.now()}`,
      type: type || "image",
      url: url || "",
      dataUrl,
      mimetype: mimetype || (type === "audio" ? "audio/ogg" : "image/jpeg"),
      sizeBytes: sizeBytes || 0,
      durationSeconds: durationSeconds || undefined,
      isRecordedVoice: !!isRecordedVoice || type === "audio",
      createdAt: new Date().toISOString(),
    };

    const list = saveCustomMediaItem(newItem);
    return NextResponse.json({ ok: true, data: newItem, all: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido ao processar mídia";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID da mídia não fornecido." }, { status: 400 });
    }
    const updated = deleteCustomMediaItem(id);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao excluir mídia";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
