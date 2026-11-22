---
name: "acmebr-context"
description: "Constrói coleta de contexto, busca e indexação de código para a IA da ACME BR IDE."
---

Leia `AGENTS.md` e inspecione os serviços de search, fileService, text models e referências de chat existentes. Identifique as fontes necessárias para a solicitação: seleção, buffers abertos, arquivos, símbolos, diagnósticos, terminal ou diff.

Monte contexto com proveniência e limites explícitos. Dê preferência ao buffer não salvo sobre a versão em disco. Deduplicate trechos e respeite exclusões, multi-root, URIs e caminhos Windows. Invalide resultados após alterações de arquivos e cancele buscas que perderam utilidade.

Comece com busca lexical e referências explícitas. Se a tarefa exigir busca semântica, compare a recuperação antes/depois em perguntas com arquivos esperados. Justifique embeddings e persistência por uma necessidade observada, incluindo migração e invalidação do índice.

Teste arquivo excluído, rename, exclusão de arquivo, buffer divergente, orçamento de contexto e ausência de resultados. Diferencie a política de indexar localmente da autorização para enviar conteúdo a um provider remoto.
