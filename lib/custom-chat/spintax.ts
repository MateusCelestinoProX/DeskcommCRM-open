/**
 * Motor de Spintax e Resolução de Variáveis Dinâmicas
 * Projetado para variação máxima de conteúdo e prevenção de assinaturas de spam.
 */

export interface ContactRecipient {
  raw: string;
  primeiroNome: string;
  segundoNome: string;
  nomeCompleto: string;
  customTexto: string;
  numero: string;
  numeroLimpo: string;
  numeroFormatado?: string;
  chatId?: string;
  valido?: boolean;
  motivoInvalido?: string;
}

/**
 * Resolve Spintax recursivo: `{Olá|Oi|{E aí|Fala}}` -> escolhe aleatoriamente uma opção.
 * Suporta múltiplos níveis de aninhamento.
 */
export function resolveSpintax(template: string): string {
  if (!template) return "";

  let result = template;
  const regex = /\{([^{}]+)\}/g;

  // Itera enquanto houver grupos de chaves {a|b|c}
  while (regex.test(result)) {
    result = result.replace(regex, (_, choicesStr: string) => {
      const choices = choicesStr.split("|");
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex] ?? "";
    });
  }

  return result;
}

/**
 * Obtém saudação dinâmica baseada na hora local do Brasil (0-23h).
 */
export function getSaudacaoDinamica(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Interpreta o formato de contato exigido:
 * Formato padrão:
 *   (primeiro nome)/(segundonome)/(primeiro + segundo nome), (string, texto) + numero formatado
 *
 * Exemplos suportados:
 *   - Carlos/Eduardo/Carlos Eduardo, Cliente VIP +5531999999999
 *   - João/Silva/João Silva, Interessado no plano 5511988887777
 *   - Maria/Santos, 31977776666
 *   - +5531999998888
 */
export function parseContactLine(line: string): ContactRecipient | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Procura por número de telefone na linha (+55 ou dígitos)
  const phoneMatch = trimmed.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4}[-\s]?\d{4}|\d{8,11})/g);
  
  // Extrai o último match de número caso haja números no texto customizado
  let numeroRaw = "";
  if (phoneMatch && phoneMatch.length > 0) {
    numeroRaw = phoneMatch[phoneMatch.length - 1] ?? "";
  }

  // Remove caracteres não numéricos do telefone
  let digitos = numeroRaw.replace(/\D/g, "");

  // Se faltar o 55 no início, adiciona
  if (digitos.length === 10 || digitos.length === 11) {
    digitos = "55" + digitos;
  }

  const numeroFormatado = digitos.length >= 10 ? `+${digitos}` : numeroRaw.trim();

  // Remove a parte do telefone para analisar os nomes e texto customizado
  let prefixPart = trimmed;
  if (numeroRaw) {
    const lastIndex = trimmed.lastIndexOf(numeroRaw);
    if (lastIndex !== -1) {
      prefixPart = trimmed.substring(0, lastIndex).trim();
      // Remove vírgula ou traço no final se houver
      prefixPart = prefixPart.replace(/[,;+-\s]+$/, "").trim();
    }
  }

  let primeiroNome = "";
  let segundoNome = "";
  let nomeCompleto = "";
  let customTexto = "";

  // Divide por vírgula para separar a parte dos nomes da parte de string/texto
  const commaParts = prefixPart.split(",");
  const nomesSegment = (commaParts[0] ?? "").trim();
  if (commaParts.length > 1) {
    customTexto = commaParts.slice(1).join(",").trim();
  }

  if (nomesSegment) {
    // Verifica separação por barras: primeiro/segundo/completo
    const slashParts = nomesSegment.split("/").map((s) => s.trim());
    if (slashParts.length >= 3) {
      primeiroNome = slashParts[0] ?? "";
      segundoNome = slashParts[1] ?? "";
      nomeCompleto = slashParts[2] ?? "";
    } else if (slashParts.length === 2) {
      primeiroNome = slashParts[0] ?? "";
      segundoNome = slashParts[1] ?? "";
      nomeCompleto = `${primeiroNome} ${segundoNome}`.trim();
    } else if (slashParts.length === 1) {
      const seg = slashParts[0] ?? "";
      const spaceParts = seg.split(/\s+/);
      primeiroNome = spaceParts[0] ?? "";
      segundoNome = spaceParts.slice(1).join(" ") ?? "";
      nomeCompleto = seg;
    }
  }

  // Limpeza de parênteses se o usuário inseriu com "(Carlos)/(Eduardo)"
  primeiroNome = primeiroNome.replace(/[()]/g, "").trim();
  segundoNome = segundoNome.replace(/[()]/g, "").trim();
  nomeCompleto = nomeCompleto.replace(/[()]/g, "").trim();
  customTexto = customTexto.replace(/[()]/g, "").trim();

  return {
    raw: trimmed,
    primeiroNome: primeiroNome || "Cliente",
    segundoNome: segundoNome || "",
    nomeCompleto: nomeCompleto || primeiroNome || "Cliente",
    customTexto: customTexto,
    numero: numeroFormatado,
    numeroLimpo: digitos,
  };
}

/**
 * Processa um bloco de texto com múltiplas linhas de contatos.
 */
export function parseContactRecipients(text: string): ContactRecipient[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const recipients: ContactRecipient[] = [];

  for (const line of lines) {
    const parsed = parseContactLine(line);
    if (parsed && parsed.numeroLimpo.length >= 10) {
      recipients.push(parsed);
    }
  }

  return recipients;
}

/**
 * Substitui todas as variáveis dinâmicas no template para o contato fornecido:
 * - `{primeiro_nome}` ou `(primeiro nome)`
 * - `{segundo_nome}` ou `(segundonome)`
 * - `{nome_completo}` ou `(primeiro + segundo nome)`
 * - `{custom_texto}` ou `(string, texto)`
 * - `{numero}`
 * - `{saudacao}`
 */
export function replaceDynamicTags(template: string, contact: ContactRecipient): string {
  const saudacao = getSaudacaoDinamica();

  return template
    .replace(/\{(?:primeiro_nome|primeironome)\}|\(primeiro nome\)/gi, contact.primeiroNome)
    .replace(/\{(?:segundo_nome|segundonome)\}|\(segundonome\)/gi, contact.segundoNome)
    .replace(/\{(?:nome_completo|nomecompleto)\}|\(primeiro \+ segundo nome\)/gi, contact.nomeCompleto)
    .replace(/\{(?:custom_texto|customtexto|texto)\}|\(string, texto\)/gi, contact.customTexto)
    .replace(/\{(?:numero|telefone)\}/gi, contact.numero)
    .replace(/\{saudacao\}/gi, saudacao);
}

/**
 * Gera o texto final único para um contato específico, resolvendo variáveis e Spintax.
 */
export function generateUniqueMessage(template: string, contact: ContactRecipient): string {
  const withTags = replaceDynamicTags(template, contact);
  return resolveSpintax(withTags);
}

/**
 * Gera uma amostra de variações para visualização ao vivo no editor.
 */
export function generateSpintaxPreviews(template: string, count: number = 3): string[] {
  const sampleContact: ContactRecipient = {
    raw: "Carlos/Eduardo/Carlos Eduardo, Cliente VIP +5531999999999",
    primeiroNome: "Carlos",
    segundoNome: "Eduardo",
    nomeCompleto: "Carlos Eduardo",
    customTexto: "Cliente VIP",
    numero: "+5531999999999",
    numeroLimpo: "5531999999999",
  };

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateUniqueMessage(template, sampleContact));
  }
  return results;
}
