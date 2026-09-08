# Spec 20 — Sistema de 22 Temas Ultra-Modernos e Painel de Seleção Modal

## 1. Contexto e Motivação
A experiência visual do Deskcomm CRM foi completamente reformulada com uma arquitetura de temas de alta fidelidade visual, consistindo em **22 temas customizados** divididos em **14 temas escuros** e **8 temas claros**, acompanhados de um modal de galeria moderno (`ThemeGalleryModal`) com suporte a React Portal, preview em tempo real e proteção contra flash de conteúdo não estilizado (anti-FOUC).

---

## 2. Catálogo de Temas Disponíveis

### Temas Escuros (14 temas)
1. **Dark Default (`dark`):** O tema escuro padrão equilibrado e profissional.
2. **Cyberpunk Neon (`cyberpunk-neon`):** Fundo ultra escuro com ciano elétrico e magenta neon vibrante.
3. **Midnight Tokyo (`midnight-tokyo`):** Azul noite profundo com detalhes em néon violeta/roxo.
4. **Emerald Matrix (`emerald-matrix`):** Verde esmeralda hacker sobre preto profundo.
5. **Nordic Frost (`nordic-frost`):** Tons árticos azulados e cinzas frios nórdicos.
6. **Sunset Horizon (`sunset-horizon`):** Degradê crepuscular laranja, coral e violeta.
7. **Luxury Gold (`luxury-gold`):** Dourado refinado sobre preto ônix de alto padrão.
8. **Monokai Pro (`monokai-pro`):** Clássico de desenvolvimento com amarelo quente e tons pastel.
9. **Deep Crimson (`deep-crimson`):** Vermelho rubi e carmesim elegante sobre carvão.
10. **Neon Dracula (`neon-dracula`):** Roxo gótico com destaques em verde neon e rosa.
11. **Solar Flare (`solar-flare`):** Laranja âmbar solar sobre fundo grafite escuro.
12. **Deep Sapphire (`deep-sapphire`):** Azul safira real profundo com ciano brilhante.
13. **Coffee Mocha (`coffee-mocha`):** Tons quentes de café torrado, caramelo e chocolate.
14. **Ultra Black / OLED (`ultra-black`):** Preto 100% puro para máxima economia de energia e contraste.

### Temas Claros (8 temas)
15. **Light Default (`light`):** Branco limpo, profissional e balanceado.
16. **Light Indigo (`light-indigo`):** Índigo suave e azul corporativo moderno sobre fundo branco neve.
17. **Soft Rose (`soft-rose`):** Tons quentes e delicados de rosa chá, pêssego e linho.
18. **Clean Slate (`clean-slate`):** Cinzas neutros elegantes de ardósia com azul frio.
19. **Botanical Mint (`botanical-mint`):** Verde menta botânico, sálvia e frescor natural.
20. **Sunny Amber (`sunny-amber`):** Amarelo âmbar e dourado quente radiante.
21. **Sky Blue (`sky-blue`):** Azul celeste cristalino e arejado com detalhes em cobalto.
22. **Warm Ivory (`warm-ivory`):** Marfim suave e bege clássico editorial.

---

## 3. Arquitetura Técnica

### 3.1. Variáveis CSS e Compatibilidade Tailwind
- **Arquivo:** `app/globals.css`
- Cada tema possui seu bloco `[data-theme="NOME"]` definindo as variáveis semânticas:
  - `--background`, `--foreground`
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`
  - `--primary`, `--primary-foreground`
  - `--secondary`, `--secondary-foreground`
  - `--muted`, `--muted-foreground`
  - `--accent`, `--accent-foreground`
  - `--destructive`, `--destructive-foreground`
  - `--border`, `--input`, `--ring`
  - Paleta de pessoas/agendas: `--agenda-pessoa-1` até `--agenda-pessoa-8`
- Suporte nativo ao `@custom-variant dark` do Tailwind v4 para que utilitários `dark:` respondam a qualquer um dos 14 temas escuros via `&:where([data-theme=...])`.

### 3.2. Gerenciador de Temas: `lib/theme.tsx`
- **Hook `useTheme()`:**
  - Retorna `theme`, `setTheme`, `resolvedTheme` e catálogo `THEMES`.
- **Persistência:**
  - Salvo no `localStorage` sob a chave `deskcomm-theme`.
  - Atualização imediata do atributo `data-theme` e da classe `dark` no elemento `<html>` do documento.
  - Sincronização entre abas através de event listener de `storage`.

### 3.3. Prevenção de FOUC (Flash of Unstyled Content)
- **Arquivo:** `app/layout.tsx`
- Script inline executado sincronicamente no topo do `<head>` antes da hidratação do React:
  ```html
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem("deskcomm-theme")||"dark";document.documentElement.setAttribute("data-theme",t);var d=["light","light-indigo","soft-rose","clean-slate","botanical-mint","sunny-amber","sky-blue","warm-ivory"].indexOf(t)===-1;if(d){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
    }}
  />
  ```

### 3.4. Modal de Seleção: `components/theme/ThemeGalleryModal.tsx`
- **Renderização via React Portal:**
  - Montado diretamente em `document.body` através de `createPortal(modalContent, document.body)`.
  - Garante centralização visual perfeita (`fixed inset-0 flex items-center justify-center`) com `z-[99999]`, imune a `overflow: hidden` ou propriedades de `transform` em layouts pai.
- **Funcionalidades da Interface:**
  - Barra de pesquisa com filtro instantâneo por nome, descrição ou categoria.
  - Abas de filtro: "Todos (22)", "Escuros (14)", "Claros (8)".
  - Cards com swatch de 4 cores representativas (Background, Card, Primary e Accent).
  - Indicador visual de tema ativo e badge do modo (Dark / Light).
  - Fechamento com tecla `Escape`, clique no backdrop ou botão de fechar.
- **Integração no Menu do Usuário:**
  - Acessível a partir de `components/shell/UserMenu.tsx` com atalho direto "Galeria de Temas".

---

## 4. Testes e Validação
- Verificado em navegadores Chrome, Firefox e Safari.
- Ausência de FOUC ao recarregar a página (F5 e Ctrl+Shift+R).
- Alternância instantânea de cores em tempo real sem travamentos.
