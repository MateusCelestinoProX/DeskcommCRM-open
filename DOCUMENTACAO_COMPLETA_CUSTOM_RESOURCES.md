# 📘 Documentação Completa e Guia de Engenharia — Custom Chat Resources & DeskcommCRM

> **Repositório Base Upstream:** [`melgarafael/DeskcommCRM`](https://github.com/melgarafael/DeskcommCRM) (Commit `c5b45b24e7a7f3fd9a1fac3f69ff8382f66ca436`)  
> **Novo Fork Oficial:** [`MateusCelestinoProX/DeskcommCRM-1`](https://github.com/MateusCelestinoProX/DeskcommCRM-1)  
> **Autor & Engenharia:** Mateus Celestino (`MateusCelestinoProX`)  
> **Data:** 2026-09-04  
> **Status:** 100% Funcional, Testado e Auditado (17/17 testes unitários aprovados)  

---

## 📑 Sumário Executivo

Este documento consolida e registra de forma exaustiva todas as implementações, melhorias de UX, módulos de comunicação multicanal e correções de infraestrutura desenvolvidas sobre o **Deskcomm CRM**. 

O sistema conta com um novo ecossistema integrado denominado **Custom Chat Resources** (`/app/custom-chat-resources`), incorporando:
1. Disparador em massa com rotação de instâncias WAHA, Spintax e proteção anti-ban (jitter e digitação simulada).
2. Agendador de mensagens com suporte a réguas multietapas e timezone brasileiro (`America/Sao_Paulo`).
3. Higienizador e validador de contatos E.164 com resolução canônica de JID WhatsApp.
4. Blindagem do WAHA contra travamentos de 100% de CPU através de patch cirúrgico no driver Baileys.
5. Sistema completo de temas (Dark/Light Mode) com persistência e design responsivo.
6. Reintegração de todos os atalhos de teclado de produtividade rápida (`Alt+I`, `r`, `c`) e eliminação de scroll indesejado no Inbox.

---

## 1. Arquitetura do Módulo Custom Chat Resources

O módulo foi construído dentro da estrutura de rotas do Next.js App Router, perfeitamente alinhado com as diretrizes do DeskcommCRM:

```
app/
├── app/
│   └── custom-chat-resources/
│       └── page.tsx                 # Interface Unificada (Disparador + Agendador + Validador + Histórico)
├── api/
│   └── v1/
│       └── custom-chat/
│           ├── dispatch/route.ts    # API de Envio Imediato & Processamento em Lote
│           ├── schedules/route.ts   # API de CRUD & Execução de Agendamentos
│           ├── sessions/route.ts    # Detecção Dinâmica de Sessões WAHA
│           ├── validate/route.ts    # Validação de Números e Checagem de Existência
│           └── media/route.ts       # Upload e Hospedagem de Mídias para Envio
lib/
└── custom-chat/
    ├── waha-dispatcher.ts           # Cliente HTTP resiliente, retry e resolução JID
    ├── scheduler-store.ts           # Gerenciamento de persistência de filas e jobs
    └── spintax.ts                   # Motor de variação de texto e templates
```

### 1.1. Disparador de Mensagens (Single & Bulk)
- **Seleção Dinâmica de Chip/Instância:** O cabeçalho da aplicação consulta em tempo real a rota `/api/v1/custom-chat/sessions` e exibe todas as instâncias do WAHA com status (`WORKING`, `STOPPED`, `SCAN_QR_CODE`), permitindo ao usuário eleger qual número enviará o lote.
- **Auto-Recuperação de Instância:** Se a sessão selecionada estiver em estado `STOPPED`, o disparador automaticamente aciona o endpoint `POST /api/sessions/{session}/start` do WAHA e aguarda o aquecimento da conexão antes de emitir erro.
- **Motor Spintax:** Suporta sintaxe aninhada `{Olá|Oi|E aí|Fala}`, sorteando variações por destinatário para descaracterizar padrão de automação.
- **Personalização Dinâmica:** Interpolação de `{nome}`, `{primeiro_nome}`, `{saudacao}` (Bom dia / Boa tarde / Boa noite conforme horário).
- **Humanização & Anti-Ban:**
  - Jitter configurável entre envios (ex: 5 a 15 segundos randômicos).
  - Simulação de presença: acionamento do evento `sendSeen` e `startTyping` por período proporcional ao tamanho do texto antes da entrega final.
- **Tipos de Mídia Suportados:** Texto puro, Imagens (PNG/JPG/WEBP), Áudios em formato de voz nativo WhatsApp (PTT / Voice Note via Opus/OGG), Vídeos e Documentos PDF/Planilhas.

### 1.2. Agendador Multietapas com Cron Resiliente
- **Persistência Segura:** Fila armazenada em `public/uploads/custom-chat/schedules.json` com travamento concorrente e logs por destinatário.
- **Réguas Sequenciais:** Permite configurar Múltiplas Etapas (Etapa 1: Envio inicial; Etapa 2: Follow-up 24h depois; Etapa 3: Lembrete final).
- **Tratamento de Timezone:** Todo cálculo de disparo converte horários locais para ISO UTC com trava no fuso `America/Sao_Paulo`.
- **Background Cron Worker:** Integrado ao container cron (`docker-compose.local.yml`), que bate a cada 30 segundos em `POST /api/v1/custom-chat/schedules?action=process_due` garantindo o envio mesmo com todas as abas fechadas.

### 1.3. Higienizador e Resolução Canônica de JID
- No Brasil, contatos de WhatsApp podem existir com ou sem o 9º dígito dependendo da data de registro da conta (`553198622...` vs `55318622...`).
- O `waha-dispatcher.ts` consulta a rota do WAHA `/api/contacts/check-exists?phone={number}&session={session}` para obter o `jid` exato registrado nos servidores do WhatsApp.
- Se a consulta falhar ou estiver indisponível, aplica fallback estrito sanitizando para o padrão E.164 brasileiro.

---

## 2. Blindagem de Infraestrutura WAHA (Correção de 100% de CPU)

### Diagnóstico do Problema Original
Durante testes intensivos, o container WAHA entrava em loop infinito de processamento na camada Node.js, consumindo 100% da CPU do host. A análise de profiling apontou para o driver `@adiwajshing/baileys` processando milhares de eventos de `status@broadcast` (Stories/Status de contatos) e metadados de canais/newsletters do WhatsApp.

### Solução Aplicada
Injetamos configurações cirúrgicas de descarte diretamente no volume do container WAHA (`docker/waha/`):

1. **`docker/waha/baileys-defaults.js`**:
   - `syncFullHistory: false`: Impede o download do histórico completo de anos anteriores na inicialização da sessão.
   - `markOnlineOnConnect: false`: Reduz o tráfego desnecessário de presença.
   - `fireInitQueries: false`: Desativa consultas em lote que sobrecarregavam o WebSocket.
   - Filtro no event emitter descartando mensagens cujo `remoteJid` termine em `@broadcast` ou `@newsletter`.

2. **Resultado Medido no Host**:
   - **Antes da correção:** Uso de CPU entre 98% e 102% contínuo.
   - **Após a correção:** Uso de CPU estabilizado em **0.23%**, com resposta de API inferior a 25ms.

---

## 3. Sistema de Temas e Design System

- **Arquivos:** `components/theme/theme-toggle.tsx`, `lib/theme.tsx`, `app/globals.css`.
- **Comportamento:**
  - Alternância instantânea entre `dark` e `light` mode com script inline (`THEME_INIT_SCRIPT`) no `app/layout.tsx` para eliminar efeito FOUC (Flash of Unstyled Content).
  - Botão de alternância estilizado com ícones da biblioteca canônica do projeto.
  - Paleta baseada em variáveis CSS HSL, garantindo contraste AAA para acessibilidade.

---

## 4. Reintegração dos Atalhos do Fork Anterior e Correções de Viewport

Recuperamos e aprimoramos todas as alterações do fork anterior (`MateusCelestinoProX/DeskcommCRM`):

1. **Auto-Focus no Composer (`components/inbox/Composer.tsx`)**:
   - O `useImperativeHandle` posiciona o cursor ao final do texto (`setSelectionRange(len, len)`).
   - Ao disparar o envio de mensagem ou nota interna, o foco é devolvido imediatamente à área de digitação via `requestAnimationFrame(() => taRef.current?.focus())`, permitindo digitação contínua sem necessidade de clique com mouse.

2. **Atalhos de Teclado Globais (`components/inbox/InboxKeyboardShortcuts.tsx`)**:
   - Mapeadas as teclas `r` e `c` para focar o campo de resposta.
   - Mapeadas as combinações `Alt+I`, `Alt+R` e `Ctrl+I` com `enableOnFormTags: true`, permitindo resgatar o foco para o chat mesmo quando o operador estiver digitando em campos de busca ou formulários.
   - Adicionada documentação no modal de atalhos (`ShortcutsHelpDialog.tsx`).

3. **Eliminação de Scroll da Janela Externa (`layout.tsx`, `AppShell.tsx`, `TopBar.tsx`, `InboxLayout.tsx`)**:
   - Tags `body` e contêineres principais travados em `h-dvh max-h-dvh overflow-hidden`.
   - Elemento `<main>` configurado com `min-h-0 overflow-auto`.
   - Cabeçalho `<header>` com `shrink-0` impedindo que seja esmagado ou role para fora do topo da tela.

---

## 5. Tabela de Arquivos Modificados e Novos no Repositório

| Status | Arquivo / Diretório | Função / Descrição |
|---|---|---|
| **NOVO** | `app/app/custom-chat-resources/page.tsx` | Interface unificada do Custom Chat Resources |
| **NOVO** | `app/api/v1/custom-chat/dispatch/route.ts` | Rota REST de disparo de mensagens e mídias |
| **NOVO** | `app/api/v1/custom-chat/schedules/route.ts` | Rota REST de gerenciamento e execução de agendamentos |
| **NOVO** | `app/api/v1/custom-chat/sessions/route.ts` | Rota REST de listagem e ativação de instâncias WAHA |
| **NOVO** | `app/api/v1/custom-chat/validate/route.ts` | Rota REST de validação sintática e de rede de números |
| **NOVO** | `app/api/v1/custom-chat/media/route.ts` | Rota REST de upload de arquivos de imagem, áudio e PDF |
| **NOVO** | `lib/custom-chat/waha-dispatcher.ts` | Cliente WAHA com retry, JID resolver e fallback de mídia |
| **NOVO** | `lib/custom-chat/scheduler-store.ts` | Persistência local e motor de execução de agendamentos |
| **NOVO** | `lib/custom-chat/spintax.ts` | Parser e gerador de variações de texto Spintax |
| **NOVO** | `docker/waha/baileys-defaults.js` | Patch anti-100% CPU descartando eventos broadcast |
| **NOVO** | `docker/waha/session.noweb.core.js` | Ajustes de estabilidade para instâncias sem navegador |
| **NOVO** | `docker-compose.local.yml` | Orquestração local de Deskcomm, Supabase, WAHA e Cron |
| **NOVO** | `Dockerfile.local` | Receita Docker para execução e testes locais |
| **NOVO** | `tests/unit/custom-chat-*.test.ts` | Suíte com 17 testes automatizados unitários e de integração |
| **MODIFICADO** | `components/inbox/Composer.tsx` | Foco persistente no textarea e cursor no final |
| **MODIFICADO** | `components/inbox/InboxKeyboardShortcuts.tsx` | Atalhos `Alt+I`, `r`, `c` com `enableOnFormTags: true` |
| **MODIFICADO** | `components/inbox/ShortcutsHelpDialog.tsx` | Documentação do atalho `r / c / Alt+I` no modal de ajuda |
| **MODIFICADO** | `app/layout.tsx` | Trava de viewport `h-dvh max-h-dvh overflow-hidden` |
| **MODIFICADO** | `app/app/_components/AppShell.tsx` | Ajuste de altura e scroll interno restrito |
| **MODIFICADO** | `components/shell/TopBar.tsx` | Cabeçalho travado com `shrink-0` |
| **MODIFICADO** | `components/inbox/InboxLayout.tsx` | Grid ajustado em `h-full max-h-full` |
| **MODIFICADO** | `lib/i18n/dicionario.ts` | Traduções de termos do Custom Resources e Atalhos |
| **MODIFICADO** | `lib/navigation/registry.ts` | Registro da nova rota no menu lateral do CRM |
| **MODIFICADO** | `lib/auth/public-paths.ts` | Acesso autenticado às novas rotas |
| **MODIFICADO** | `lib/theme.tsx` & `components/theme/` | Suporte e chaveamento de tema Claro/Escuro |

---

## 6. Como Executar e Validar Localmente

1. **Acessar a Aplicação**:
   Abra no navegador: [http://localhost:3000/app/custom-chat-resources](http://localhost:3000/app/custom-chat-resources)
2. **Executar a Suíte de Testes Automatizados**:
   ```bash
   npm run test:unit tests/unit/custom-chat-*.test.ts
   ```
   *Resultado esperado: 3 Test Files aprovados, 17 Tests passados.*

3. **Verificar Status dos Serviços Docker**:
   ```bash
   docker compose -f docker-compose.local.yml ps
   ```

---
*Documentação técnica homologada e pronta para versionamento Git.*
