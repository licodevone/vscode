---
name: "acmebr-workbench"
description: "Implementa interface e fluxos de edição assistida na ACME BR IDE usando serviços e contribuições do workbench."
---

Leia `AGENTS.md` e as instruções locais da área alterada. Procure em `src/vs/workbench/contrib/chat`, `src/vs/workbench/contrib/inlineCompletions` e `src/vs/editor/contrib` o fluxo correspondente. Leia as instruções de design, tokens e acessibilidade aplicáveis em `.github/instructions/`.

Escolha uma contribuição ou extensão existente como ponto de entrada. Reutilize comandos, context keys, injeção de serviços, text models e infraestrutura de diffs. Não aplique uma edição de IA sobre uma versão divergente do documento sem tratar o conflito. Preserve seleção, undo/redo e conteúdo não salvo.

Implemente o fluxo com localização, tokens de tema, teclado, estados de erro e cancelamento. Registre listeners e disposables no escopo correto. Verifique comportamento com teste direcionado e, quando o build estiver disponível, execute o fluxo na IDE.

Para lançamento isolado, consulte a skill existente `.agents/skills/launch/SKILL.md`. Para explorar componentes, use o MCP component-explorer após instalar as dependências do produto. Não confunda um teste em uma página do navegador com validação do workbench Electron.
