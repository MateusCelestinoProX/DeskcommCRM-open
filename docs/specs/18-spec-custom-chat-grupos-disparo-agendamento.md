# Spec 18 — Disparo e Agendamento para Grupos WhatsApp no Custom Chat

## 1. Contexto e Motivação
Anteriormente, os módulos **Disparador** e **Agendador** em *Custom Chat Resources* (`/app/custom-chat-resources`) operavam exclusivamente com envio direto para números de telefone individuais (ex: `5511999998888@c.us`), exigindo o processo de resolução canônica de nono dígito do Brasil.
A necessidade operacional surgiu de possibilitar que mensagens e mídias sejam disparadas ou agendadas diretamente para **Grupos de WhatsApp** (`@g.us`), selecionados interativamente pelo usuário a partir das instâncias ativas do WAHA conectadas ao CRM.

---

## 2. Arquitetura da Solução

O fluxo de ponta a ponta envolve as seguintes camadas:

```
┌─────────────────────────┐
│   DisparadorView /      │ <--- Seletor Modo: "Números" ou "Grupos"
│   AgendadorView (UI)    │ <--- Busca e seleção com Badge de contagem
└───────────┬─────────────┘
            │ 1. hook useWahaGroups
            ▼
┌─────────────────────────┐
│ GET /api/v1/custom-chat │
│ /groups?session={name}  │
└───────────┬─────────────┘
            │ 2. Consulta WAHA API
            ▼
┌─────────────────────────┐
│  waha-dispatcher.ts     │ ---> GET /api/{session}/groups
│  getWahaGroups()        │ ---> Normaliza id string ou { _serialized }
└─────────────────────────┘
            │ 3. Disparo / Agendamento
            ▼
┌─────────────────────────┐
│ /api/v1/custom-chat/    │
│ dispatch ou schedules   │
└───────────┬─────────────┘
            │ 4. Bypass de resolução canônica se targetChatId.endsWith('@g.us')
            ▼
┌─────────────────────────┐
│ WAHA HTTP API           │ ---> POST /api/sendText ou /api/sendFile
└─────────────────────────┘
```

---

## 3. Componentes e Alterações Detalhadas

### 3.1. Rota de API: Listagem de Grupos
- **Arquivo:** `app/api/v1/custom-chat/groups/route.ts`
- **Método:** `GET /api/v1/custom-chat/groups?session={sessionName}`
- **Parâmetros:**
  - `session` (string, obrigatório): Nome da instância WAHA pareada.
- **Resposta Sucesso:**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "120363405473281127@g.us",
        "name": "Prévias do Matheus",
        "participantsCount": 229
      }
    ],
    "total": 1
  }
  ```
- **Tratamento de Erros:**
  - Retorna `400 Bad Request` se a sessão for omitida.
  - Retorna `500 Internal Server Error` se o WAHA estiver offline ou inacessível.

### 3.2. Hook React: `useWahaGroups`
- **Arquivo:** `hooks/custom-chat/useWahaGroups.ts`
- **Responsabilidades:**
  - Requisitar `/api/v1/custom-chat/groups?session=${session}` automaticamente sempre que a sessão selecionada mudar.
  - Controlar estados de `loading`, `error`, `groups` e função `refresh()`.
  - Cache em memória para evitar chamadas redundantes caso o usuário alterne de aba.

### 3.3. Biblioteca de Despacho: `lib/custom-chat/waha-dispatcher.ts`
- **Função `getWahaGroups(session: string)`:**
  - Envia requisição HTTP com timeout via `AbortController` (6 segundos) para `${baseUrl}/api/${session}/groups`.
  - Autenticação via header `X-Api-Key`.
  - **Normalização de JID:** O WAHA pode retornar o campo `id` como string (`12036...@g.us`) ou como objeto composto (`{ _serialized: "...", user: "...", server: "g.us" }`). A função normaliza ambos os casos.
  - Filtra estritamente IDs que terminem com `@g.us`.
  - Extrai o nome através de `subject`, `name` ou `groupMetadata.subject`.
  - Extrai a quantidade de participantes através de `participants.length`.
- **Tratamento no Envio (`sendViaWaha`):**
  - Se o destinatário terminar com `@g.us`, a função pula a resolução de nono dígito brasileira (`resolveTargetChatId`), mantendo o JID do grupo inalterado.
  - Suporta mensagens de texto puro e envio de mídias (Base64, URL ou Buffer local).

### 3.4. Motor de Agendamento: `lib/custom-chat/scheduler-store.ts`
- **Adaptação dos Tipos:**
  - `ScheduledMessage` e payload de criação aceitam `targetType: "individual" | "group"`.
  - Quando `targetType === "group"`, o campo `phone` armazena o JID completo do grupo (`... @g.us`), exibindo um badge distintivo no monitor de tarefas agendadas.

### 3.5. Interfaces de Usuário (UI)
- **`app/app/custom-chat-resources/_components/DisparadorView.tsx`:**
  - Switch de seleção: "Números de Telefone" / "Grupos do WhatsApp".
  - Seletor de grupos com campo de filtro de busca por nome ou ID.
  - Pré-visualização do total de membros do grupo.
- **`app/app/custom-chat-resources/_components/AgendadorView.tsx`:**
  - Seleção idêntica com suporte a recorrência e data/hora futura.
  - Tabela de agendamentos exibe tag de grupo com ícone de usuários e link rápido para cancelamento.

---

## 4. Testes e Validação
- **Teste Unitário/Manual do Endpoint:**
  ```bash
  curl -s 'http://localhost:3000/api/v1/custom-chat/groups?session=org_dfbfd2d3_30783a'
  ```
  Retorno verificado com sucesso (`120363405473281127@g.us`).
- **Validação de Build:**
  - Compilação limpa no Next.js (`npm run build`).
