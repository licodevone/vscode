# Implementar execução de agentes e ferramentas

Use `acmebr-ai-runtime`, `$acmebr-ai-runtime` e `$acmebr-mcp`. Mapeie agent host, ferramentas de chat e cliente MCP existentes antes de criar um loop paralelo.

Entregue estados explícitos de planejamento, execução, espera de ferramenta, interrupção e conclusão. Integre leitura, busca e terminal conforme o escopo; adicione ferramentas MCP com a política de autorização do cliente. Mantenha a decisão de executar ferramentas fora do controle de texto externo do modelo.

Defina limites de passos e contexto, cancelamento propagado, encerramento de processos e retomada sem repetir ações não idempotentes. Teste tool calls fragmentadas, ferramenta recusada, erro de transporte, interrupção durante uma chamada e tentativa de alteração das instruções via conteúdo do repositório. Expanda para delegação somente após contratos e isolamento estarem definidos.
