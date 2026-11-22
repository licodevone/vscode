# Implementar chat nativo com provider configurável

Use o papel `acmebr-ai-runtime` e a skill `$acmebr-ai-runtime`. Leia `AGENTS.md` e a direção do produto. Implemente na base Code OSS uma primeira conversa utilizável com provider próprio, aproveitando a API de chat e o SecretStorage do extension host. Prefira uma extensão embutida se não for necessário mudar o core.

Entregue configuração de URL base e modelo, comandos para salvar/remover a chave e um participante `@acmebr` no chat nativo. O endpoint inicial pode usar o contrato OpenAI-compatible Chat Completions; não o anuncie como compatível com toda API ou todo modelo. Não envie arquivos automaticamente nessa primeira etapa.

O cliente deve produzir texto incremental, respeitar cancelamento durante headers e corpo, aplicar timeout, tratar HTTP e SSE inválido e impedir que uma resposta truncada seja tratada como concluída. Aceite HTTP apenas em loopback para provedores locais. Não siga redirects com credenciais nem reflita corpos de erro que possam conter dados sensíveis.

Teste com um servidor HTTP local controlado: fragmentos SSE, UTF-8 dividido, cancelamento, erro HTTP, timeout e encerramento incompleto. Compile a extensão e valide a integração em um extension host quando as dependências estiverem disponíveis. Registre limitações do teste e o procedimento de uso.
