# Runbook — Reprodução e Restauração Exata do Ambiente de Produção Deskcomm CRM na VPS

Este guia documenta o passo a passo completo para recriar, restaurar ou clonar o ambiente de produção do **Deskcomm CRM** e seus serviços satélites em uma VPS limpa (Ubuntu 22.04 / 24.04 LTS), garantindo que o sistema fique **exatamente idêntico** ao servidor ativo.

---

## 1. Visão Geral da Infraestrutura na VPS

O servidor hospeda 4 aplicações interdependentes:

| Aplicação | Execução | Porta Local | Descrição |
| :--- | :--- | :--- | :--- |
| **Deskcomm CRM** | Systemd (`node .next/standalone/server.js`) | `3000` | Aplicação principal Next.js 16 (App Router, Turbopack). |
| **WAHA (WhatsApp API)** | Docker (`devlikeapro/waha:arm`) | `3030` | Motor HTTP de WhatsApp conectado às sessões oficiais/não-oficiais. |
| **SendPortal** | Docker (`sendportal-app`, `db`, `redis`) | `8080` | Plataforma de envio e gestão de campanhas de e-mail marketing. |
| **Google Maps Extractor** | Python + Next.js | `8000` e `3001` | Scraper backend FastAPI/Python e frontend Next.js de captura de leads. |

---

## 2. Requisitos de Sistema
- **Sistema Operacional:** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (x86_64 ou ARM64/aarch64).
- **Recursos Mínimos Recomendados:** 2 vCPUs, 4 GB de memória RAM, 40 GB de disco SSD.
- **Portas e Conectividade:** Porta 22 (SSH) aberta; Cloudflared Túneis para exposição segura sem necessidade de abrir portas web no firewall do provedor.

---

## 3. Preparação do Servidor e Pacotes Básicos

Execute como usuário `ubuntu` (ou com privilégios `sudo`):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw jq

# 1. Instalação do Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm

# 2. Instalação do Docker e Docker Compose Plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Criação da estrutura de diretórios
mkdir -p /home/ubuntu/apps /home/ubuntu/scripts /home/ubuntu/backups
```

---

## 4. Instalação e Subida do Contêiner WAHA (WhatsApp API)

O CRM depende do WAHA operando na porta local `3030` (mapeada para a porta interna 3000 do contêiner):

```bash
# Executa o contêiner do WAHA com reinicialização automática e persistência
docker run -d \
  --name deskcomm-waha \
  --restart unless-stopped \
  -p 3030:3000 \
  -v waha_data:/app/.sessions \
  -e WHATSAPP_DEFAULT_ENGINE=NOWEB \
  -e WHATSAPP_RESTART_ALL_SESSIONS=True \
  -e WAHA_API_KEY=deskcomm_d7bac2bed65ed9abd736e95822df2bdd \
  -e WAHA_API_KEY_SHA512=2afb908abf976329ad53d295a49a82f58bd0d1ccb66d1034359797b3b8fd151469493c74611e365b0040eb5da398f4cff07e28b5a9a06bd4f6ea98c79169994c \
  -e WAHA_WEBHOOK_BASE_URL=http://163.176.22.221:3000 \
  -e WAHA_HMAC_SECRET=8b24ac63e6149346a697cc257c3be5e4f914375d9cbfa4d073e4aaf59c758bd3 \
  devlikeapro/waha:arm
```
*(Caso seu servidor seja x86_64, use a imagem `devlikeapro/waha:latest`)*.

---

## 5. Clonagem e Configuração do Deskcomm CRM

### 5.1. Clonando o Repositório
```bash
cd /home/ubuntu/apps
# Repositório Fechado (já inclui o .env de produção):
git clone https://github.com/MateusCelestinoProX/DeskcommCRM-closed.git deskcomm-crm
cd deskcomm-crm
git checkout main
```

*(Caso use o repositório público `DeskcommCRM-open`, clone-o e crie o arquivo `.env` baseado na seção 5.2).*

### 5.2. Especificação do Arquivo `.env` de Produção
Crie ou confirme o arquivo `/home/ubuntu/apps/deskcomm-crm/.env`:

```ini
# --- Supabase / Backend Core ---
NEXT_PUBLIC_SUPABASE_URL=https://wadthecazvoorscsvjlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZHRoZWNhenZvb3JzY3N2amxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDU5NDMsImV4cCI6MjEwNDAyMTk0M30.VVN9_lOgoShLBU3--ThS4KEMvqyuBB029p2qqHjc51g
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZHRoZWNhenZvb3JzY3N2amxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ0NTk0MywiZXhwIjoyMTA0MDIxOTQzfQ.J-BOlcKC7nGh-r4DNAV-m-jrMglJAFr3pVYE-elmJY8
SUPABASE_DB_URL=postgresql://postgres:Deskcomm%402026%21@db.wadthecazvoorscsvjlf.supabase.co:5432/postgres

# --- URLs e Secrets Internos ---
NEXT_PUBLIC_APP_URL=http://163.176.22.221:3000
INTERNAL_SECRET=5f49b499d4c87401bc33c3fe172efafbd0d5a8ee7adcbf80dc9cd6b16099c24a
INTERNAL_CRON_SECRET=5f49b499d4c87401bc33c3fe172efafbd0d5a8ee7adcbf80dc9cd6b16099c24a
AI_CRED_AES_KEY=SsWPgmEIrCOweW2kpHEjhklr7Pz17aCl1VIiZHMkLBk=
CPF_ENCRYPTION_KEY=79290dc569f5827c5e54b77931ddf718
WAHA_BYO_ENCRYPTION_KEY=8ea9b73ec2d2ec4431a509e8b2e9803a

# --- WAHA WhatsApp Engine ---
WAHA_IMAGE=devlikeapro/waha:arm
WAHA_API_BASE_URL=http://127.0.0.1:3030
WAHA_API_KEY=deskcomm_d7bac2bed65ed9abd736e95822df2bdd
WAHA_API_KEY_SHA512=2afb908abf976329ad53d295a49a82f58bd0d1ccb66d1034359797b3b8fd151469493c74611e365b0040eb5da398f4cff07e28b5a9a06bd4f6ea98c79169994c
WAHA_HMAC_SECRET=8b24ac63e6149346a697cc257c3be5e4f914375d9cbfa4d073e4aaf59c758bd3
WAHA_WEBHOOK_BASE_URL=http://163.176.22.221:3000
WHATSAPP_DEFAULT_ENGINE=NOWEB
WHATSAPP_RESTART_ALL_SESSIONS=True

# --- Cache / Redis ---
UPSTASH_REDIS_REST_URL=http://127.0.0.1:8079
UPSTASH_REDIS_REST_TOKEN=274409ea16196c974337f3beeb2ed4a3
```

---

## 6. Build de Produção Standalone

Instale as dependências e gere o build compilado otimizado com Turbopack:

```bash
cd /home/ubuntu/apps/deskcomm-crm

# 1. Instalação de dependências
npm install

# 2. Compilação de Produção
npm run build

# 3. Cópia dos assets estáticos para o diretório standalone
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/.env
```

---

## 7. Configuração do Serviço Systemd

Crie o arquivo `/etc/systemd/system/deskcomm-crm.service`:

```ini
[Unit]
Description=Deskcomm CRM Next.js Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/deskcomm-crm
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
EnvironmentFile=/home/ubuntu/apps/deskcomm-crm/.env
ExecStart=/usr/bin/node /home/ubuntu/apps/deskcomm-crm/.next/standalone/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ative e inicie o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable deskcomm-crm.service
sudo systemctl start deskcomm-crm.service
sudo systemctl status deskcomm-crm.service
```

---

## 8. Rotina de Backup Automático

Crie o script `/home/ubuntu/scripts/backup_apps.sh`:

```bash
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p "$BACKUP_DIR"

# Backup do .env e sessões WAHA
tar -czf "$BACKUP_DIR/deskcomm_env_$TIMESTAMP.tar.gz" /home/ubuntu/apps/deskcomm-crm/.env
docker run --rm -v waha_data:/data -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/waha_sessions_$TIMESTAMP.tar.gz" -C /data .

# Retenção de 7 dias
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -delete
```

Adicione ao crontab (`crontab -e`):
```cron
0 3 * * * /home/ubuntu/scripts/backup_apps.sh >> /home/ubuntu/backups/cron.log 2>&1
```

---

## 9. Checklist de Verificação e Saúde

Após o deploy, execute os seguintes comandos para validar 100% da integridade do sistema:

1. **Status do Serviço Next.js:**
   ```bash
   systemctl is-active deskcomm-crm.service
   # Deve retornar: active
   ```

2. **Resposta HTTP do CRM:**
   ```bash
   curl -sI http://localhost:3000
   # Deve retornar: HTTP/1.1 307 Temporary Redirect (para /login ou /app)
   ```

3. **Comunicação com o WAHA:**
   ```bash
   curl -s -H "X-Api-Key: deskcomm_d7bac2bed65ed9abd736e95822df2bdd" http://127.0.0.1:3030/api/server/version
   # Deve retornar JSON com a versão do WAHA
   ```

4. **Sessões e Grupos no Custom Chat:**
   ```bash
   curl -s http://localhost:3000/api/v1/custom-chat/sessions
   # Deve listar as sessões com status WORKING
   ```

5. **Exibição dos 22 Temas:**
   Abra a aplicação no navegador, acesse o Menu do Usuário -> "Galeria de Temas" e verifique a alternância em tempo real entre os 14 temas escuros e 8 temas claros.
