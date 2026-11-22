# Implementar sugestões e próximas edições

Use `acmebr-workbench` com `$acmebr-workbench` e `$acmebr-context`. Inspecione inline completions e providers já existentes para integrar sugestões ao editor nativo.

Entregue sugestões de baixa latência com debounce, cancelamento de requisições antigas, cache compatível com a versão do documento e aceitação total/parcial. Não use a chave ou o endpoint de chat como prova de capacidade de autocomplete: defina o contrato adequado ao provider escolhido.

Avalie depois sugestões multilinha, imports e próxima localização de edição, inclusive outros arquivos. Meça latência em um cenário local reproduzível. Teste digitação durante resposta, mudança de arquivo, undo, exclusões e desativação por linguagem. Compare o comportamento com a referência oficial do Cursor Tab antes de declarar paridade.
