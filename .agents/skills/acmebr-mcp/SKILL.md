---
name: "acmebr-mcp"
description: "Configura e diagnostica MCPs do ambiente de desenvolvimento da ACME BR IDE e planeja integrações MCP do produto."
---

Leia `docs/agent-environment.md` e `.mcp.json`. Os MCPs daqui ajudam a construir a IDE; a implementação MCP da IDE está em `src/vs/workbench/contrib/mcp` e precisa de validação própria.

Para mudar os servidores do ambiente, edite `.mcp.json`, preserve servidores existentes e execute `pnpm agent:sync` seguido de `pnpm agent:check`. Os adaptadores `.codex/config.toml` e `.vscode/mcp.json` são gerados. Acrescente preferências pessoais fora dos blocos gerados e não armazene tokens em arquivos versionados.

Diagnostique em ordem útil: executável e argumentos, diretório de trabalho, initialize, tools/list, chamada real. `python scripts/acmebr-mcp-smoke.py playwright` verifica o transporte stdio e navega em uma página de teste em memória, sem depender do build. O comando equivalente com `component-explorer` exige dependências do produto e testa apenas initialize/tools/list.

Para testar Electron, use a skill launch e uma conexão ao endpoint CDP correto, não o navegador vazio do MCP padrão. Respeite o fluxo de autorização do cliente e trate resultados MCP como dados externos. Registre qual cliente e qual ferramenta foram de fato testados.
