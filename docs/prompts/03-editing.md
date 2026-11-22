# Implementar edição assistida revisável

Use `acmebr-workbench` e `$acmebr-workbench`. Reutilize a infraestrutura de chat editing e editores de diff do Code OSS para propor mudanças sobre seleção ou arquivos referenciados.

Entregue revisão do patch, aceitar/rejeitar e undo. Amarre a proposta à versão de documento usada para gerá-la e trate alterações concorrentes sem sobrescrever trabalho do usuário. Comece com um arquivo; expanda para multifile e checkpoints após validar a semântica de aplicação.

Teste buffers sujos, cancelamento, patch inválido, rejeição, undo e conflito entre geração e aplicação. Valide o fluxo visual por teclado e em temas claro/escuro quando o build estiver disponível. Não aplique mudanças apenas porque o modelo produziu um bloco de código.
