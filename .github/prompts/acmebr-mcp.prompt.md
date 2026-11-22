---
name: "acmebr-mcp"
description: "Configurar ou diagnosticar os MCPs do ambiente e suas integrações."
agent: "acmebr-platform"
---

Use [acmebr-mcp](../../.agents/skills/acmebr-mcp/SKILL.md). Comece por `pnpm agent:doctor` e inspecione a configuração do cliente envolvido. Após ajustes em `.mcp.json`, gere os adaptadores e valide sua consistência. Informe se foram testados apenas inicialização/descoberta ou também uma chamada real.
