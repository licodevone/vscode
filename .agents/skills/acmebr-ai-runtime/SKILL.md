---
name: "acmebr-ai-runtime"
description: "Implementa providers, streaming, tool calls e ciclo de execução dos agentes oferecidos pela ACME BR IDE."
---

Leia `AGENTS.md`; antes de alterar o agent host, leia `src/vs/platform/agentHost/AGENTS.md` e instruções mais específicas. Mapeie os contratos atuais de modelos e ferramentas em `src/vs/workbench/contrib/chat/common` e os adaptadores em `extensions/copilot`.

Defina a fronteira entre interface, execução, provider e ferramenta antes de alterar o contrato. Reutilize CancellationToken internamente e adapte AbortSignal apenas na fronteira do SDK/HTTP. Mantenha o cancelamento válido durante toda a leitura do stream e libere suas inscrições.

Faça o provider representar autenticação, capacidades e erros explicitamente. Não suponha que a presença do código Copilot concede autenticação ou serviço ao fork. Consulte documentação oficial de APIs; o MCP openaiDeveloperDocs atende documentação OpenAI, não documentação de todos os providers.

Valide streaming fragmentado, tool calls incompletas, cancelamento, desconexão e expiração de credenciais com um provider controlado. Evite retries de ações com efeitos colaterais sem idempotência. Não grave prompts, arquivos do usuário ou chaves em logs por padrão.
