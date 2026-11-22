---
name: "acmebr-plan"
description: "Planeja funcionalidades e paridade com Cursor na ACME BR IDE, mapeando o Code OSS existente antes da implementação."
---

Leia `AGENTS.md` e `docs/product-direction.md` a partir da raiz do repositório. Trate os requisitos adicionais do usuário como evolução do mesmo produto.

Converta a solicitação em um fluxo observável. Procure contribuições, serviços, interfaces e testes existentes com `rg`. Para a área envolvida, registre o que pode ser reutilizado, o que precisa de adaptação e o que ainda exige investigação. Existência de código não comprova funcionamento no fork.

Proponha uma entrega vertical com critérios de aceite, arquivos prováveis, dependências e validação. Para requisitos de paridade, use `docs/cursor-parity.md`; consulte a referência oficial correspondente quando o comportamento atual do Cursor importar. Mantenha funcionalidades locais e dependências de serviços cloud distinguíveis.

Planejamento por si só não inclui editar o produto. Se a solicitação também pedir implementação, prossiga a partir do plano sem inventar uma nova etapa de aprovação. Atualize a matriz apenas com evidência do resultado.
