# Direção da ACME BR IDE

## Requisitos definidos pelo usuário

Usar `acmebr-ide`, o checkout existente do Code OSS, como base e construir uma IDE com todas as funcionalidades do Cursor. A preparação de agentes, skills, comandos e MCPs é parte do ambiente que permitirá construir esse produto. Em seguida, iniciar as implementações e manter os prompts em `docs/prompts/`.

O objetivo é paridade funcional: editor, chat e agentes integrados, sugestões de código, edição assistida, contexto do repositório, ferramentas e fluxos locais/remotos. A referência evolui; a [matriz de paridade](cursor-parity.md) deve acompanhar os requisitos e as evidências. A matriz inicial é um inventário de trabalho, sujeito a expansão conforme o levantamento do produto de referência.

## Base técnica

O checkout usa TypeScript, Electron e pnpm. Preservar editor, terminal, Git, debug, extensões e recursos de linguagem existentes. Aproveitar as contribuições atuais de chat, inline completions, agent host, sessions e MCP. A presença desses módulos não comprova que seus serviços externos ou autenticação funcionarão no fork.

Escolher entre contribuição do core e extensão embutida conforme a necessidade. Providers configuráveis devem ficar separados da UI e não depender de uma única conta comercial. Credenciais pertencem ao armazenamento de secrets. Marca, distribuição, registry de extensões, atualizações e backend são decisões explícitas do produto.

## Primeiras entregas

1. Ambiente de desenvolvimento: papéis, skills, prompts, configurações MCP sincronizadas e diagnóstico reproduzível.
2. Primeiro fluxo de IA: extensão embutida ACME BR AI, configuração de endpoint/modelo, chave em SecretStorage e conversa com streaming no chat nativo. Testar o transporte com um servidor local controlado.
3. Contexto: seleção e referências explícitas, buffers não salvos, busca lexical e exclusões. Avaliar recuperação antes de escolher um índice semântico.
4. Edição assistida: propostas com diff, aceitar/rejeitar, desfazer e detecção de alterações concorrentes.
5. Ferramentas: execução de leitura/busca/terminal e MCP sob a política do usuário, com cancelamento e limites de execução.
6. Completar as demais famílias da matriz: autocomplete preditivo, múltiplos agentes, worktrees, execução remota, automações, integrações e distribuição.

Essa ordem organiza as dependências e não reduz o objetivo de paridade. Novos requisitos do usuário podem alterar a prioridade.

## Evidência de conclusão

Uma família só fica verificada após o fluxo funcionar no produto e os testes relevantes passarem. Registrar o que foi implementado, o que foi executado e o que ainda depende de build, credenciais ou infraestrutura. Configurar os agentes de desenvolvimento não implementa os agentes do produto.
