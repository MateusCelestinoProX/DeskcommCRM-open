# Meta-Tema MCP OS Multi — Deskcomm CRM

Documentação técnica do tema visual imersivo **MCP OS Multi**, integrando 13 shaders WebGL em tempo real procedurais e 5 galerias de papéis de parede com transição crossfade e design system Liquid Glass fosco translúcido.

> **Especificação Completa**: Para detalhes aprofundados sobre arquitetura de Stacking Context, catálogo de shaders, galerias e contratos de persistência, consulte:
> [Spec 21: Meta-Tema MCP OS Multi](specs/21-spec-meta-tema-mcp-os-multi.md)

---

## Destaques Técnicos

1. **13 Shaders WebGL Procedurais**: Renderização com biblioteca `ogl` acelerada por GPU, suporte a `devicePixelRatio: 2` e gerenciamento de contexto à prova de memory leak.
2. **5 Galerias Fotográficas (66 Wallpapers)**: Anime, Cyberpunk, Arquitetura Minimalista, Natureza e Sci-Fi com transição suave em crossfade e 0% de uso de GPU.
3. **Botão e Modal `Backgrounds`**: Seletor visual integrado à TopBar do CRM ativo exclusivamente no tema `mcp-os-multi`.
4. **Isolamento de Stacking Context**: Canvas no background com `z-index: -10` e `pointer-events: none` resolvendo definitivamente o bug de oclusão de telas e modais em navegadores com aceleração por hardware.
5. **Estética Liquid Glass**: Superfícies de vidro fosco translúcido luminoso (`rgba(15, 20, 42, 0.45)` a `0.58`) com desfoque profundo (`blur(28px)` a `blur(48px)`), contraste tipográfico aprimorado e saturação calibrada.
