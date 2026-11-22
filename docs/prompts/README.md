# Prompts de construção da ACME BR IDE

Execute os prompts a partir de `acmebr-ide`, preservando o Code OSS como base. Os agentes de desenvolvimento e as skills estão descritos em [agent-environment.md](../agent-environment.md). A meta é a [paridade funcional com Cursor](../cursor-parity.md).

Os arquivos `acmebr-*.prompt.md` desta pasta são as fontes dos seis comandos de trabalho. Execute `pnpm agent:sync` para gerar as cópias em `.github/prompts/`.

| Prompt de implementação | Resultado esperado |
| --- | --- |
| [01 — Chat com provider próprio](01-chat-provider.md) | Primeiro fluxo de IA nativo com streaming e SecretStorage |
| [02 — Contexto do código](02-code-context.md) | Seleção, arquivos, buffers e busca com proveniência |
| [03 — Edição com diff](03-editing.md) | Propostas revisáveis, aceitar/rejeitar e undo |
| [04 — Agente e ferramentas](04-agent-tools.md) | Loop de execução controlado, MCP e cancelamento |
| [05 — Autocomplete](05-autocomplete.md) | Sugestões incrementais e próximas edições |
| [06 — Sessões e operação](06-sessions-cloud.md) | Worktrees, sessões, agentes remotos e automações |

Esses prompts organizam o início da implementação e devem evoluir com os requisitos. Cada entrega precisa registrar validação e atualizar a matriz; ela não encerra automaticamente a família inteira.
