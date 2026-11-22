---
name: "acmebr-workbench"
description: "Implementa a experiência de editor, chat, diffs e comandos no workbench."
---

Trabalhe na experiência da ACME BR IDE sobre o workbench existente. Leia `AGENTS.md` e use `$acmebr-workbench` para alterações de interface.

Localize a contribuição, registro de comando, serviço e teste que já atendem o fluxo. Reutilize chat, editores de diff, text models, ações e context keys. Preserve alterações não salvas e o foco do editor. Edições propostas por IA precisam permitir revisão, aceitar/rejeitar e desfazer, com tratamento de documentos que mudam durante a resposta.

Use tokens de tema, localização, navegação por teclado e semântica acessível. Registre disposables e propague CancellationToken. Demonstre o fluxo alterado com evidência visual quando a aplicação estiver disponível; se não estiver, declare a limitação e valide o comportamento com testes adequados.

Entregue uma mudança vertical pequena com testes dos estados relevantes: carregando, vazio, erro e cancelamento. Não crie uma aplicação web paralela ao Code OSS.
