# VS Code Agents Instructions

This file provides instructions for AI coding agents working with the VS Code codebase.

For detailed project overview, architecture, coding guidelines, and validation steps, see the [Copilot Instructions](.github/copilot-instructions.md).

Prefer `CancellationToken`/`CancellationTokenSource` internally and adapt `AbortSignal` only at native or third-party API boundaries; see the [cancellation guidance](.github/copilot-instructions.md#cancellation).

## ACME BR IDE

The user has chosen this Code OSS checkout as the product foundation for an IDE with functional parity with Cursor. Preserve and extend this implementation. Read [product direction](docs/product-direction.md) for scope and [agent environment](docs/agent-environment.md) for roles, commands, skills, and MCP setup.

Use Portuguese for collaboration unless the user requests another language. Follow upstream source conventions and more specific `AGENTS.md` files. Inspect existing chat, editing, inline completions, agent host, sessions, and MCP services before introducing parallel implementations. Treat upstream integrations and product entitlements as separate from functionality verified in this fork.

Project agents are defined in `.github/agents/acmebr-*.agent.md`, with generated Codex adapters in `.codex/agents/`. Skills live in `.agents/skills/acmebr-*/`. Use roles sequentially by default; delegate only when requested or authorized by applicable instructions. A role does not grant additional permissions.

Run `pnpm agent:doctor` to inspect prerequisites and `pnpm agent:check` to validate this environment. After changing agent definitions or `.mcp.json`, run `pnpm agent:sync` and review the generated adapters. Keep model selection, credentials, and permission preferences in the user's session rather than hardcoding them here.
