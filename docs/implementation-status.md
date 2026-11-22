# Implementação inicial

## Entrega 1 — ambiente de desenvolvimento

Criados seis agentes especializados, seis skills, seis comandos de trabalho, prompts em `docs/prompts/` e três MCPs. As configurações de Codex e VS Code são geradas a partir das fontes e validadas por `pnpm agent:check`. O servidor component-explorer upstream e a skill launch foram preservados.

## Entrega 2 — primeiro chat com provider próprio

Implementada a extensão embutida `extensions/acmebr-ai`, incluída no workspace pnpm e na lista de compilação das extensões do produto. Ela registra o participante `@acmebr` na API nativa de chat e dois comandos: configurar provedor e remover a chave do endpoint atual.

O provider inicial usa Chat Completions com streaming SSE. URL e modelo ficam nas configurações da aplicação; a chave fica no SecretStorage e é associada ao endpoint exato. O cliente aceita HTTPS ou HTTP em loopback, não segue redirects e mantém cancelamento e timeout durante todo o corpo da resposta. Erros não refletem o corpo do provider. O chat envia texto e o histórico recente de turnos bem-sucedidos desse participante. Referências de arquivo/seleção são recusadas explicitamente nesta primeira versão.

O contrato se baseia na [API de Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) e em seus [eventos de streaming](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events). Compatibilidade depende do endpoint e do modelo configurados; APIs Responses, mensagens multimodais e ferramentas exigem adaptadores posteriores.

## Como preparar e usar

Depois de instalar as dependências do produto com pnpm, compile a extensão com `pnpm --dir extensions/acmebr-ai compile`, ou compile o produto pelas tasks existentes. A extensão usa a API estável do checkout e é descoberta como extensão embutida. Para exercitar no selfhost, lance o build com a skill launch e execute `ACME BR AI: Configure Provider` na paleta. Informe a URL base com o prefixo da API, o modelo e a chave, quando necessária. Abra o chat e envie `@acmebr Olá`.

Os nomes aparecem traduzidos quando o pacote de idioma e as traduções correspondentes estiverem disponíveis. As mensagens usam o mecanismo de localização da API do editor.

## Validação realizada

- Consistência do ambiente, referências de prompts, frontmatter das seis skills e parsing dos sete arquivos TOML.
- Compilação TypeScript da extensão contra `src/vscode-dts/vscode.d.ts` do próprio checkout.
- Onze testes do cliente HTTP/SSE com servidor local: fragmentação UTF-8, cancelamento, timeout, erro HTTP, redirect, stream truncado, formato inválido, limites de saída e liberação de recursos.
- Testes do adaptador de chat com API de extensão controlada e um servidor local; esse teste não substitui execução no extension host real.
- MCP de documentação: initialize e tools/list. MCP Playwright: initialize, tools/list e chamada real no Edge headless, com criação/leitura de conteúdo em memória e fechamento do navegador.

O produto completo ainda não tem dependências instaladas, build do cliente ou runtime Electron neste checkout. Portanto a UI real, a descoberta no selfhost e o MCP component-explorer ainda não foram executados. Nenhuma chave de provider externo foi configurada ou utilizada.

## Reexecutar testes

```powershell
pnpm agent:check
pnpm --dir extensions/acmebr-ai test
# Após compilar a extensão:
pnpm --dir extensions/acmebr-ai test:adapter
python scripts/acmebr-mcp-smoke.py playwright
python scripts/acmebr-mcp-smoke.py openaiDeveloperDocs
```

O teste de transporte usa a remoção de tipos nativa do Node 24; o teste do adaptador usa a extensão compilada. Para esta validação inicial, o compilador e os tipos Node foram instalados isoladamente em `.tmp/acmebr-tooling`, sem instalar todas as dependências nativas do produto.
