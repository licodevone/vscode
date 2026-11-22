---
name: "acmebr-quality"
description: "Valida ou revisa alterações da ACME BR IDE com testes direcionados e cenários de edição e execução de agentes."
---

Leia `AGENTS.md`, o diff e os testes vizinhos. Em uma revisão, não modifique arquivos sem pedido de correção. Em uma tarefa de testes, adicione casos que capturem comportamento e falhas reais.

Escolha a menor validação que cobre a mudança. No Windows, use `scripts/test.bat --run <arquivo compilado>` para testes unitários apropriados ou o runner específico da área; consulte `--help` e o padrão dos testes existentes antes de construir seletores. A saída compilada precisa estar atual. Não use `pnpm test`, pois o script raiz só informa como executar testes.

Para agent host, consulte suas instruções e suites dedicadas. Para camadas de imports, use `pnpm run valid-layers-check` quando a alteração afetar a arquitetura. Aproveite diagnósticos de tasks/watch existentes. Para o ambiente de agentes, execute `pnpm agent:check`.

Nos fluxos de IA, procure cancelamento tardio, alteração concorrente de buffer, rejeição/desfazer de patch, repetição de ferramentas e exposição de secrets. Documente gatilho, resultado esperado, evidência e limitações. Falta de dependências ou de build é uma limitação, não um teste aprovado.
