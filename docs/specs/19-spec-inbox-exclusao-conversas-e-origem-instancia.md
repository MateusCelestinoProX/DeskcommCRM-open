# Spec 19 — Exclusão de Conversas (Local e WhatsApp) e Identificador de Instância de Origem no Inbox

## 1. Contexto e Motivação
A gestão de conversas no Inbox (`/app/inbox`) necessitava de duas evoluções fundamentais:
1. **Identificação da Instância de Entrada:** Quando múltiplos números ou instâncias WAHA estão conectados, o atendente precisa saber por qual canal/número o cliente entrou em contato.
2. **Exclusão Completa e Auditada de Conversas:** Possibilidade de excluir conversas diretamente pela interface, com opção de remover apenas localmente (banco de dados) ou simultaneamente do dispositivo WhatsApp via API (WAHA).

---

## 2. Identificador de Instância no Inbox

### 2.1. Arquitetura e Dados
No componente de listagem de conversas (`components/inbox/ConversationListItem.tsx`):
- A consulta consolidada de conversas inclui dados da sessão do canal associado (`channel_sessions`), obtendo o campo `display_name` ou `waha_session_name`.
- O item exibe um chip/badge visual sutil e elegante:
  ```tsx
  {conversation.session_name && (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
      <Smartphone className="h-3 w-3" />
      {conversation.session_name}
    </span>
  )}
  ```

---

## 3. Mecanismo de Exclusão de Conversas

### 3.1. Interface de Usuário
- **Cabeçalho da Conversa (`components/inbox/ConversationHeader.tsx`):**
  - Menu de ações (três pontos) com opção "Excluir conversa".
  - Ícone de lixeira com destaque visual destrutivo.
- **Modal de Confirmação (`components/inbox/DeleteConversationDialog.tsx`):**
  - Alerta sobre a irreversibilidade da ação.
  - Opção via checkbox / radio:
    1. *Excluir somente no sistema Deskcomm CRM* (remove do banco local).
    2. *Excluir no sistema e no WhatsApp Cloud (WAHA)* (chama o endpoint do WAHA para apagar o chat no dispositivo conectado).

### 3.2. Hook React: `useDeleteConversation`
- **Arquivo:** `hooks/inbox/useDeleteConversation.ts`
- **Responsabilidades:**
  - Gerenciar estados `isDeleting`, `error`, `success`.
  - Disparar `DELETE /api/v1/conversations/[id]?deleteOnWaha=true|false`.
  - Atualizar a lista de conversas em tempo real via mutate do cache / revalidação.

### 3.3. Endpoint Backend: `DELETE /api/v1/conversations/[id]`
- **Arquivo:** `app/api/v1/conversations/[id]/route.ts` & `app/api/v1/conversations/_handler.ts`
- **Fluxo de Execução:**
  1. **Validação de Permissão e Organização:** Garante que o usuário autenticado pertença à mesma organização da conversa.
  2. **Remoção no WAHA (opcional):**
     - Se `deleteOnWaha === true`, consulta a sessão e JID da conversa.
     - Executa `wahaClient.deleteChat(session, chatId)`.
     - Falhas pontuais no WAHA (ex: chat já deletado no aparelho) não impedem a exclusão no banco, mas são registradas no log.
  3. **Remoção no Banco de Dados (Supabase):**
     - Exclui em cascata ou desvincula mensagens associadas (`messages`), tickets e registros de vínculo de atendimento.
  4. **Trilha de Auditoria:**
     - Registra o evento `CONVERSATION_DELETED` em `lib/audit/actions.ts` contendo:
       - `user_id`: ID do usuário que solicitou a exclusão.
       - `conversation_id`: ID da conversa removida.
       - `metadata`: `{ deleteOnWaha: boolean, deletedMessagesCount: number }`.

---

## 4. Testes e Validação
- Exclusão testada com sucesso na interface e no banco de dados.
- Verificação do registro de log de auditoria emitido em `audit_logs`.
