# Matriz inicial de paridade com Cursor

Objetivo: cobrir todas as funcionalidades solicitadas, usando o Code OSS existente. Consulta inicial às referências oficiais em 2026-11-22. A lista precisa de inventário detalhado por versão; não representa uma auditoria completa nem afirma paridade já atingida.

Estados: **investigar** = ainda sem avaliação de ponta a ponta; **em implementação** = código iniciado; **validado** = fluxo executado com evidência. Caminhos abaixo são pontos de investigação encontrados no checkout, não comprovação de equivalência.

| Família | Comportamento a cobrir | Base candidata | Responsável | Estado |
| --- | --- | --- | --- | --- |
| Editor e extensibilidade | Arquivos, terminal, Git, debug, extensões e configurações | `src/vs/editor`, `src/vs/workbench`, `extensions` | platform | investigar |
| Chat e modelos | Conversa, histórico, streaming, modelos e credenciais próprias | `contrib/chat`, extensão `extensions/acmebr-ai` | ai-runtime | em implementação |
| Agent, Ask e Plan | Planejamento e execução iterativa com ferramentas e interrupção | `contrib/chat`, `platform/agentHost` | ai-runtime | investigar |
| Edição assistida | Edição contextual e multifile, diff, aceitar/rejeitar, undo e checkpoints | `contrib/chat/common/editing`, infraestrutura do editor | workbench | investigar |
| Tab e próxima edição | Sugestões multilinha, aceitação parcial, imports e navegação entre edições | `contrib/inlineCompletions`, `editor/contrib` | workbench | investigar |
| Contexto e busca | Referências, seleção, símbolos, indexação, exclusões e recuperação | serviços de search e referências do chat | context | investigar |
| Ferramentas locais | Arquivos, busca, terminal, navegador, erros e permissões | ferramentas do chat e terminal | ai-runtime | investigar |
| Customização | Rules, skills, comandos, hooks, plugins e subagentes | `contrib/chat`, AI Customization | architect | investigar |
| MCP do produto | stdio/HTTP, descoberta, configuração, autenticação e ferramentas | `src/vs/workbench/contrib/mcp` | platform | investigar |
| Sessões e worktrees | Sessões persistentes, múltiplos agentes, isolamento e revisão | `src/vs/sessions`, `platform/agentHost` | ai-runtime | investigar |
| Agentes remotos | Execução cloud/background, ambientes, artefatos e retomada | agent host e backend a definir | platform | investigar |
| Automações e revisão | Gatilhos, agendamento, análise de alterações e integração com PRs | infraestrutura a definir | quality | investigar |
| Experiência multimodal | Imagens, voz, browser e fluxos visuais conforme inventário de referência | chat, browser e providers | workbench | investigar |
| Integrações e CLI | Serviços externos, repositórios, execução headless, SDK e CLI | `cli`, extensões e backend a definir | platform | investigar |
| Equipes e operação | Contas, políticas, privacidade, métricas e administração | serviços de configuração e backend a definir | architect | investigar |
| Distribuição | Identidade ACME BR, instaladores, atualização e distribuição de extensões | `product.json`, `build`, `resources` | platform | investigar |

Evidência inicial de chat: [implementação e validação](implementation-status.md). Cliente SSE e adaptador testados localmente; a família permanece em implementação até validar o fluxo no produto completo.

## Referências oficiais consultadas

- [Cursor Agent](https://cursor.com/docs/agent/overview): execução, ferramentas e fluxos de agentes.
- [Cursor Tab](https://cursor.com/help/ai-features/tab): sugestões e próxima localização de edição.
- [Busca do Agent](https://cursor.com/docs/agent/tools/search): recuperação de contexto.
- [Customização](https://cursor.com/docs/customize-cursor): regras, skills, MCP, hooks e subagentes.
- [Cloud Agents](https://cursor.com/docs/cloud-agent/capabilities): capacidades de execução remota.

Para cada família, decompor em cenários verificáveis e acrescentar links oficiais específicos quando ela entrar em implementação. Atualizar os estados com testes e evidências locais.
