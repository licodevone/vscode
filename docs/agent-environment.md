# Ambiente de agentes da ACME BR IDE

Abra a pasta `acmebr-ide` como raiz do projeto. Ela contém o repositório Git, o produto Code OSS e todas as configurações versionadas. A direção é [paridade funcional com Cursor](product-direction.md).

## Uso imediato

```powershell
cd D:\projects\my-projects\agent.acmebr\acmebr-ide
pnpm agent:doctor
pnpm agent:check
pnpm agent:command plan
```

`agent:doctor` mostra versões e pré-requisitos sem instalar nem iniciar builds. `--strict` retorna falha quando o ambiente do produto está incompleto. `agent:check` verifica fontes, referências e consistência dos adaptadores; não executa a IDE nem comprova conexão MCP.

Use a versão de Node de `.nvmrc` e a versão de pnpm de `package.json`. Quando for necessário preparar o produto, execute `pnpm install` e use as tasks existentes de compilação. O primeiro build completo pode exigir ferramentas nativas do Windows; consulte as instruções de contribuição do upstream. Para executar com perfil isolado, siga `.agents/skills/launch/SKILL.md`.

## Agentes

| Agente | Responsabilidade |
| --- | --- |
| `acmebr-architect` | Arquitetura, contratos, paridade e entregas verticais |
| `acmebr-workbench` | Editor, chat, diffs, comandos e acessibilidade |
| `acmebr-ai-runtime` | Providers, streaming, ferramentas e agentes do produto |
| `acmebr-context` | Coleta de contexto, busca e indexação |
| `acmebr-quality` | Testes, revisão e regressões |
| `acmebr-platform` | Ambiente, Electron, build, distribuição e MCP |

As definições fonte ficam em `.github/agents/acmebr-*.agent.md`. Os adaptadores Codex ficam em `.codex/agents/acmebr-*.toml`. Nenhum perfil fixa modelo ou altera permissões. Revisão sem edição é uma instrução do papel, não um sandbox separado. O uso de um papel não exige iniciar um subagente.

No Codex, inicie uma nova sessão na raiz do repositório para carregar as configurações locais, respeitando a política de confiança do cliente. Os perfis usam o formato de agentes TOML da versão atual; clientes antigos podem exigir atualização. No VS Code/Copilot compatível, selecione o agente pelo nome. Neste ambiente de chat, ferramentas já carregadas não são alteradas retroativamente pelos arquivos criados.

## Skills e prompts

As seis skills estão em `.agents/skills/`: `$acmebr-plan`, `$acmebr-workbench`, `$acmebr-ai-runtime`, `$acmebr-context`, `$acmebr-quality` e `$acmebr-mcp`. A skill upstream `launch` foi preservada.

Os prompts de implementação solicitados ficam em [docs/prompts](prompts/README.md). Os atalhos de chat compatíveis ficam em `.github/prompts/`: `/acmebr-plan`, `/acmebr-feature`, `/acmebr-review`, `/acmebr-test`, `/acmebr-ui` e `/acmebr-mcp`. No Codex, invoque a skill correspondente; esses arquivos `.prompt.md` não criam slash commands universais no Codex. `pnpm agent:command <nome>` imprime a instrução para uso em qualquer cliente e não chama um modelo.

## MCPs

| Servidor | Finalidade | Pré-requisitos |
| --- | --- | --- |
| `openaiDeveloperDocs` | Documentação oficial da OpenAI | Acesso de rede ao endpoint HTTPS |
| `playwright` | Automação de browser com perfil em memória | pnpm, rede no primeiro uso e Microsoft Edge instalado |
| `component-explorer` | Explorar os componentes e fixtures do Code OSS | Dependências do produto instaladas e fixture config existente |

`.mcp.json` é a fonte versionada. `pnpm agent:sync` gera `.vscode/mcp.json`, o bloco MCP de `.codex/config.toml` e os perfis Codex. O servidor component-explorer preexistente foi preservado. Seu `npm exec --no` apenas executa o binário local; a instalação do projeto continua sendo feita com pnpm.

O Playwright está fixado em `@playwright/mcp@0.0.86`, com `--headless --isolated --browser msedge --caps devtools`. Para Linux/macOS ou outra instalação de browser, ajuste a fonte e sincronize os adaptadores. O browser padrão do MCP é separado do Electron da IDE; para testar a aplicação, conecte ao CDP do lançamento isolado conforme a skill launch.

```powershell
python scripts/acmebr-mcp-smoke.py playwright
python scripts/acmebr-mcp-smoke.py openaiDeveloperDocs
# Depois de instalar as dependências do produto:
python scripts/acmebr-mcp-smoke.py component-explorer
```

O smoke Playwright inicializa o protocolo, lista ferramentas, renderiza conteúdo em memória, lê esse conteúdo e fecha o browser. Os demais fazem initialize/tools/list. A conexão no cliente ainda depende do carregamento da configuração e do fluxo de confiança desse cliente.

## Manutenção

Após alterar um agente fonte, um prompt em `docs/prompts/` ou `.mcp.json`, execute `pnpm agent:sync` e `pnpm agent:check`. O frontmatter das definições ACME BR usa valores JSON entre aspas, um subconjunto de YAML, para que o gerador não dependa da instalação do produto. Ao acrescentar campos MCP, estenda o gerador: ele rejeita campos não suportados em vez de descartá-los silenciosamente.

O arquivo `.vscode/mcp.json` e os agentes Codex são gerados. Em `.codex/config.toml`, somente o bloco delimitado é gerado; preferências adicionais fora dele são preservadas. Credenciais pessoais ficam fora do Git.

Formatos usados: [agentes Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents), [agentes VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents), [prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files) e [Playwright MCP](https://github.com/microsoft/playwright-mcp).
