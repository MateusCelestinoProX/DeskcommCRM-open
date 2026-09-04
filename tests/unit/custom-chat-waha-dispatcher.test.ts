import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateTypingDuration,
  sendViaWaha,
  MediaAttachment,
} from "@/lib/custom-chat/waha-dispatcher";

describe("WAHA Dispatcher & Media Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateTypingDuration", () => {
    it("retorna no mínimo 1500ms para mensagens vazias", () => {
      expect(calculateTypingDuration("")).toBe(1500);
      expect(calculateTypingDuration(undefined)).toBe(1500);
    });

    it("calcula duração proporcional com teto máximo de 5000ms", () => {
      const shortText = "Olá mundo";
      const shortDur = calculateTypingDuration(shortText);
      expect(shortDur).toBeGreaterThanOrEqual(1500);
      expect(shortDur).toBeLessThanOrEqual(5000);

      const longText = "a".repeat(500);
      const longDur = calculateTypingDuration(longText);
      expect(longDur).toBe(5000);
    });
  });

  describe("sendViaWaha com diferentes mídias e resolução canônica", () => {
    it("dispara sendImage corretamente para imagens com resolução canônica de JID", async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/contacts/check-exists")) {
          return {
            ok: true,
            json: async () => ({ numberExists: true, chatId: "553198622489@c.us" }),
          };
        }
        return {
          ok: true,
          json: async () => ({ id: "msg_img_123" }),
        };
      });
      vi.stubGlobal("fetch", fetchMock);

      const media: MediaAttachment = {
        type: "image",
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        caption: "Foto promocional",
      };

      const res = await sendViaWaha({
        session: "org_dfbfd2d3",
        chatId: "5531998622489@c.us",
        media,
        simulateTyping: false,
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe("msg_img_123");

      const sendCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/sendImage"));
      expect(sendCall).toBeDefined();
      const calledBody = JSON.parse(sendCall[1].body);

      expect(calledBody.session).toBe("org_dfbfd2d3");
      expect(calledBody.chatId).toBe("553198622489@c.us");
      expect(calledBody.file.data).toBe("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
      expect(calledBody.caption).toBe("Foto promocional");
    });

    it("dispara sendVoice para áudios gravados na hora (PTT sem convert:true para evitar ffmpeg)", async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/contacts/check-exists")) {
          return {
            ok: true,
            json: async () => ({ numberExists: true, chatId: "553198622489@c.us" }),
          };
        }
        return {
          ok: true,
          json: async () => ({ id: "msg_voice_456" }),
        };
      });
      vi.stubGlobal("fetch", fetchMock);

      const media: MediaAttachment = {
        type: "audio",
        dataUrl: "data:audio/ogg;base64,T2dnUwACAAAAAAAAAAA=",
        filename: "voice.ogg",
        isRecordedVoice: true,
      };

      const res = await sendViaWaha({
        session: "org_dfbfd2d3",
        chatId: "5531998622489@c.us",
        media,
        simulateTyping: false,
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe("msg_voice_456");

      const sendCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/sendVoice"));
      expect(sendCall).toBeDefined();
      const calledBody = JSON.parse(sendCall[1].body);

      expect(calledBody.chatId).toBe("553198622489@c.us");
      expect(calledBody.file.mimetype).toBe("audio/ogg; codecs=opus");
      expect(calledBody.convert).toBeUndefined(); // Proteção contra crash de ffmpeg
    });

    it("dispara sendVideo para vídeos", async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/contacts/check-exists")) {
          return {
            ok: true,
            json: async () => ({ numberExists: true, chatId: "553198622489@c.us" }),
          };
        }
        return {
          ok: true,
          json: async () => ({ id: "msg_video_789" }),
        };
      });
      vi.stubGlobal("fetch", fetchMock);

      const media: MediaAttachment = {
        type: "video",
        dataUrl: "data:video/mp4;base64,AAAAHGZ0eXBtcDQy",
        filename: "video.mp4",
        caption: "Confira o vídeo demonstrativo",
      };

      const res = await sendViaWaha({
        session: "org_dfbfd2d3",
        chatId: "5531998622489@c.us",
        media,
        simulateTyping: false,
      });

      expect(res.success).toBe(true);
      const sendCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/sendVideo"));
      expect(sendCall).toBeDefined();
      const calledBody = JSON.parse(sendCall[1].body);

      expect(calledBody.chatId).toBe("553198622489@c.us");
      expect(calledBody.caption).toBe("Confira o vídeo demonstrativo");
    });

    it("dispara sendFile para documentos PDF", async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/contacts/check-exists")) {
          return {
            ok: true,
            json: async () => ({ numberExists: true, chatId: "553198622489@c.us" }),
          };
        }
        return {
          ok: true,
          json: async () => ({ id: "msg_doc_101" }),
        };
      });
      vi.stubGlobal("fetch", fetchMock);

      const media: MediaAttachment = {
        type: "document",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQK",
        filename: "proposta_comercial.pdf",
        caption: "Proposta",
      };

      const res = await sendViaWaha({
        session: "org_dfbfd2d3",
        chatId: "5531998622489@c.us",
        media,
        simulateTyping: false,
      });

      expect(res.success).toBe(true);
      const sendCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/sendFile"));
      expect(sendCall).toBeDefined();
      const calledBody = JSON.parse(sendCall[1].body);
      expect(calledBody.chatId).toBe("553198622489@c.us");
    });
  });
});
