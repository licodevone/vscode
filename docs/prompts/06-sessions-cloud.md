# Implementar sessões, isolamento e operação remota

Use `acmebr-architect` e `acmebr-platform`. Leia os módulos sessions e agent host e identifique as capacidades reutilizáveis do checkout.

Entregue primeiro sessões locais persistentes e worktrees com associação clara entre conversa, alterações e processo de execução. Planeje autenticação, ambiente de execução, artefatos, logs e retomada antes de implementar agentes cloud/background. A configuração local de MCP não constitui um backend cloud.

Decomponha automações, revisão de PRs, integrações, CLI/headless, administração e distribuição em entregas da matriz de paridade. Para cada uma, defina gatilho, autorização, comportamento observável e testes. Valide isolamento entre sessões, falhas de processo, reinicialização e expiração de credenciais. Não assuma infraestrutura, contas ou serviços do produto upstream.
