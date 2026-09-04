import { describe, expect, it } from "vitest";
import {
  resolveSpintax,
  parseContactLine,
  parseContactRecipients,
  replaceDynamicTags,
  generateUniqueMessage,
  generateSpintaxPreviews,
} from "@/lib/custom-chat/spintax";
import { sanitizeBrazilianPhone } from "@/lib/custom-chat/validator";

describe("Motor Spintax e Parser de Contatos", () => {
  it("deve resolver spintax simples de forma determinística em opções válidas", () => {
    const template = "{Olá|Oi|E aí}";
    const options = ["Olá", "Oi", "E aí"];
    for (let i = 0; i < 20; i++) {
      const resolved = resolveSpintax(template);
      expect(options).toContain(resolved);
    }
  });

  it("deve resolver spintax com aninhamento recursivo", () => {
    const template = "{Olá|{Oi|Fala}} {amigo|parceiro}";
    for (let i = 0; i < 20; i++) {
      const resolved = resolveSpintax(template);
      expect(["Olá amigo", "Olá parceiro", "Oi amigo", "Oi parceiro", "Fala amigo", "Fala parceiro"]).toContain(resolved);
    }
  });

  it("deve interpretar formato de chaves com primeiro, segundo nome e custom texto", () => {
    const line = "Carlos/Eduardo/Carlos Eduardo, Cliente VIP +5531999999999";
    const contact = parseContactLine(line);
    expect(contact).not.toBeNull();
    expect(contact?.primeiroNome).toBe("Carlos");
    expect(contact?.segundoNome).toBe("Eduardo");
    expect(contact?.nomeCompleto).toBe("Carlos Eduardo");
    expect(contact?.customTexto).toBe("Cliente VIP");
    expect(contact?.numero).toBe("+5531999999999");
    expect(contact?.numeroLimpo).toBe("5531999999999");
  });

  it("deve sanitizar telefones sem +55 adicionando o código do Brasil", () => {
    const parsed = sanitizeBrazilianPhone("31975023319");
    expect(parsed.isValidFormat).toBe(true);
    expect(parsed.cleanDigits).toBe("5531975023319");
    expect(parsed.formatted).toBe("+5531975023319");
  });

  it("deve rejeitar telefones com quantidade incorreta de dígitos", () => {
    const parsed = sanitizeBrazilianPhone("123");
    expect(parsed.isValidFormat).toBe(false);
  });

  it("deve substituir todas as tags dinâmicas no template", () => {
    const contact = {
      raw: "",
      primeiroNome: "Juliana",
      segundoNome: "Costa",
      nomeCompleto: "Juliana Costa",
      customTexto: "Proposta Platinum",
      numero: "+5511999998888",
      numeroLimpo: "5511999998888",
    };

    const template = "{Olá|Oi} {primeiro_nome} ({segundo_nome}), seu plano é {custom_texto} no número {numero}.";
    const generated = generateUniqueMessage(template, contact);

    expect(generated).toContain("Juliana");
    expect(generated).toContain("Costa");
    expect(generated).toContain("Proposta Platinum");
    expect(generated).toContain("+5511999998888");
  });

  it("deve gerar múltiplas amostras distintas de spintax previews", () => {
    const template = "{Olá|Oi|E aí|Fala} {primeiro_nome}, {tudo bem?|como vai?|tudo certo?}";
    const previews = generateSpintaxPreviews(template, 3);
    expect(previews).toHaveLength(3);
    previews.forEach((p) => {
      expect(p).toContain("Carlos");
    });
  });
});
