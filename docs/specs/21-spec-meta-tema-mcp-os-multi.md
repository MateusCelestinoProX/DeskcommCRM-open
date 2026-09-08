# Spec 21: Meta-Tema MCP OS Multi — Shaders WebGL, Galerias Fotográficas & Liquid Glass

| Metadado | Detalhe |
|---|---|
| **Data de Criação** | 08/09/2026 |
| **Status** | Implementado & Em Produção |
| **Identificador do Tema** | \`mcp-os-multi\` |
| **Responsável** | Agente de Arquitetura & Engenharia Front-end |
| **Repositórios Alvo** | \`DeskcommCRM-open\` & \`DeskcommCRM-closed\` |

---

## 1. Visão Geral e Propósito

O meta-tema **MCP OS Multi** transforma o Deskcomm CRM em uma estação de trabalho visual de imersão total inspirada no sistema operacional **MCP OS**. Ao contrário dos temas convencionais baseados em paletas estáticas, o MCP OS Multi opera como uma camada viva que combina:

1. **13 Shaders WebGL Procedurais em Tempo Real** (renderizados via GPU com aceleração de hardware através da biblioteca \`ogl\`).
2. **5 Galerias de Papéis de Parede em Alta Resolução** (66 imagens distribuídas em categorias com rotação automática em crossfade e 0% de sobrecarga de GPU).
3. **Controle Integrado de Planos de Fundo (\`BackgroundsButton\`)**: Botão de acesso rápido na TopBar que exibe um modal refinado com seletor visual e miniaturas em tempo real.
4. **Design System Liquid Glass**: Superfícies de vidro fosco translúcido luminoso (\`backdrop-blur\` profundo e saturação calibrada) para proporcionar contraste tipográfico impecável e legibilidade operacional em todas as telas (Inbox, CRM, Contatos, Agendas e Métricas).

---

## 2. Arquitetura de Camadas e Stacking Context

### 2.1 Diagnóstico do Problema de Stacking Inicial
Durante os primeiros testes em navegadores baseados em Chromium com aceleração de hardware (ex: Brave em modo anônimo), telas como o Inbox e modais sofreram oclusão de renderização. O Canvas WebGL acabava capturando eventos ou interceptando a composição visual da GPU quando modais ou sidebars re-renderizavam.

### 2.2 Isolamento de Camada e Hierarquia Definitiva
Para isolar completamente o motor visual da interface do CRM, a árvore de layout foi padronizada na seguinte hierarquia:

\`\`\`
[ Camada -10: Fundo WebGL / Slideshow ]
    └── div#deskcomm-webgl-root (fixed inset-0, z-index: -10, pointer-events: none)
            ├── <canvas> (ogl WebGL context)
            └── <div.gallery-crossfade> (duplo buffer de <img> com transição css)

[ Camada 0: Base do Sistema ]
    └── div.app-shell-root (min-h-screen, bg-transparent)

[ Camada 10: Interface Operacional (Liquid Glass) ]
    ├── TopBar (relative, z-index: 10, backdrop-blur: 24px, bg-slate-900/52)
    ├── Sidebar (relative, z-index: 10, backdrop-blur: 24px, bg-slate-900/52)
    └── <main> / Inbox / Agendas (relative, z-index: 10, backdrop-blur: 48px, bg-slate-900/45)

[ Camada 50: Modais, Diálogos e Menus Flutuantes ]
    ├── Modal de Backgrounds (fixed, z-index: 50, backdrop-blur: 32px)
    └── Dropdowns & Toasts (z-index: 50+)
\`\`\`

---

## 3. Catálogo dos 13 Shaders WebGL Procedurais

Os shaders foram convertidos e otimizados a partir do repositório MCP OS, recebendo \`u_time\`, \`u_resolution\` e uniformes dinâmicos com teto de \`devicePixelRatio: 2\` para máxima eficiência energética:

| # | ID do Shader | Nome | Descrição Visual |
|---|---|---|---|
| 1 | \`strand-luminous\` | Strand Luminous | Fios de energia bioluminescentes ondulando suavemente em gradiente ciano e púrpura. |
| 2 | \`cyber-grid\` | Cyber Grid | Grelha perspectiva tridimensional em movimento contínuo com horizonte neon. |
| 3 | \`aurora-waves\` | Aurora Waves | Cortinas de luz etéreas inspiradas na aurora boreal sobre fundo noturno. |
| 4 | \`matrix-rain\` | Matrix Rain | Chuva de glifos digitais em verde e esmeralda escorrendo pelo display. |
| 5 | \`plasma-flow\` | Plasma Flow | Ondulação orgânica de fluido de plasma com refrações cromáticas dinâmicas. |
| 6 | \`particles-field\` | Particles Field | Partículas cósmicas flutuando com interconexão de gravidade e profundidade. |
| 7 | \`quantum-void\` | Quantum Void | Vórtice quântico escuro com distorções gravitacionais e emissão de luz periférica. |
| 8 | \`warp-speed\` | Warp Speed | Túnel hipersônico estelar com linhas de fuga em alta velocidade. |
| 9 | \`synthwave-sun\` | Synthwave Sun | Pôr do sol retrowave anos 80 cortado por grade vetorial e névoa magenta. |
| 10 | \`energy-rings\` | Energy Rings | Pulsos circulares concêntricos de alta voltagem propagando-se do centro. |
| 11 | \`nebula-drift\` | Nebula Drift | Poeira estelar e nebulosas galácticas coloridas com translação suave. |
| 12 | \`electric-current\` | Electric Current | Arcos de descarga elétrica e relâmpagos procedurais ramificados. |
| 13 | \`deep-ocean\` | Deep Ocean | Feixes de luz solar penetrando a água profunda com refração bioluminescente. |

---

## 4. Sistema de Galerias Fotográficas (Zero-GPU Wallpaper Slideshow)

Quando o usuário deseja um cenário visual de alto padrão estético sem utilizar a GPU para computação gráfica procedural, o MCP OS Multi oferece 5 galerias com **66 fotografias originais**:

1. **Anime Landscape**: 15 cenários de anime estéticos, céus estrelados e vilas conceituais.
2. **Cyberpunk City**: 14 paisagens urbanas futuristas, megacidades iluminadas por néon e chuva reflexiva.
3. **Minimalist Architecture**: 12 composições arquitetônicas limpas, linhas geométricas e iluminação sutil.
4. **Nature & Cosmos**: 13 paisagens naturais exuberantes, montanhas sob a Via Láctea e auroras reais.
5. **Sci-Fi & Abstract**: 12 cenários de ficção científica, naves, portais dimensionais e conceitos de alta tecnologia.

### Mecânica de Transição:
- Dois elementos \`<img>\` sobrepostos com \`object-fit: cover\`.
- Alternância temporal de 15 segundos entre as imagens da pasta selecionada.
- Transição de suavização via CSS: \`transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)\`.
- Custo de processamento: **0% GPU** durante a permanência estática.

---

## 5. Especificação dos Componentes de Interface

### 5.1 \`BackgroundsButton.tsx\`
- Localização: \`components/theme/BackgroundsButton.tsx\`
- Visibilidade: Renderizado na \`TopBar\` estritamente quando \`theme === "mcp-os-multi"\`.
- Funcionalidades:
  - Alternador de Modo: Pílula deslizante entre **Shaders WebGL** e **Galerias de Fotos**.
  - Grade de Seleção: Cards interativos com miniaturas pré-renderizadas, indicador de seleção ativo (anel azul neon) e botão de ativação com feedback tátil.
  - Fechamento com \`Esc\` ou clique no backdrop.

### 5.2 \`McpOsBackgroundCanvas.tsx\`
- Localização: \`components/theme/McpOsBackgroundCanvas.tsx\`
- Montado na raiz de \`app/layout.tsx\` dentro do container isolado \`#deskcomm-webgl-root\`.
- Gerenciamento de ciclo de vida seguro:
  - Destruição de instâncias de programas e texturas WebGL ao desmontar ou trocar de shader.
  - Resposta a eventos de redimensionamento (\`window.resize\`) com debounce.
  - Sincronização reativa com \`localStorage\` e emissão de eventos personalizados \`deskcomm_bg_changed\`.

---

## 6. Design System Liquid Glass & Variáveis CSS

Para conferir o aspecto de vidro fosco sem escurecer excessivamente a interface nem comprometer o contraste dos textos e ícones, foram aplicadas as seguintes propriedades no tema:

\`\`\`css
/* Tema MCP OS Multi no globals.css */
[data-theme="mcp-os-multi"] {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;
  --primary: 199 89% 48%;
  --primary-foreground: 0 0% 100%;
  --border: 217 33% 22%;
}

/* Camada de vidro Liquid Glass fosco translúcido */
.mcp-os-glass {
  background: rgba(15, 20, 42, 0.45);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.mcp-os-glass-card {
  background: rgba(15, 20, 42, 0.52);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mcp-os-inbox-glass {
  background: rgba(15, 20, 42, 0.58);
  backdrop-filter: blur(48px) saturate(170%);
  -webkit-backdrop-filter: blur(48px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
\`\`\`

---

## 7. Persistência de Dados e Armazenamento Local

O estado de customização visual do operador é mantido no \`localStorage\` com os seguintes contratos de chave:

| Chave | Tipo | Descrição | Valor Padrão |
|---|---|---|---|
| \`deskcomm_theme\` | \`string\` | Identificador do tema ativo | \`mcp-os-multi\` |
| \`deskcomm_mcp_bg_mode\` | \`"shader" \| "gallery"\` | Modo de plano de fundo selecionado | \`"shader"\` |
| \`deskcomm_mcp_shader_id\` | \`string\` | ID do shader WebGL ativo | \`"strand-luminous"\` |
| \`deskcomm_mcp_gallery_id\` | \`string\` | ID da galeria de fotos ativa | \`"cyberpunk"\` |

---

## 8. Verificação e Testes

- [x] Compilação Next.js 15: Executado \`pnpm build\` com sucesso (exit code 0).
- [x] Isolamento de GPU: Testado em navegadores Chromium (Brave / Chrome) em modo anônimo e normal.
- [x] Responsividade e Stacking: Modais de grupos, disparo de mensagens, filtros de conversa e menus suspensos operam sobre o canvas sem colisão de ponteiro ou oclusão de render.
- [x] Recuperação de Contexto WebGL: Não há memory leaks de WebGL em testes de troca rápida sequencial de shaders.
