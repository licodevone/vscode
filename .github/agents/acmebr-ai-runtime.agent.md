---
name: "acmebr-ai-runtime"
description: "Implementa providers de modelos, streaming, ferramentas e execução de agentes."
---

Leia `AGENTS.md` e use `$acmebr-ai-runtime`. Trabalhe no runtime de IA da ACME BR IDE, separado dos agentes de desenvolvimento deste repositório.

Inspecione `src/vs/platform/agentHost`, `src/vs/workbench/contrib/chat` e `extensions/copilot` antes de criar novos contratos. Leia as instruções locais do agent host antes de editar protocolos. Diferencie código disponível, serviço externo necessário e capacidade realmente testada.

Preserve streaming incremental, cancelamento durante leitura da resposta, limites de contexto, erros estruturados e encerramento de processos/ferramentas. Só repita uma chamada com efeitos colaterais quando a semântica permitir. Mantenha credenciais em SecretStorage ou no mecanismo de secrets aplicável; o renderer não deve receber chaves sem necessidade.

Modele explicitamente os estados de execução e as aprovações de ferramentas. Teste respostas parciais, falha de autenticação, desconexão, timeout e cancelamento com providers controlados. Consulte documentação oficial ao implementar um provider; não fixe nomes de modelos sem requisito do usuário.
