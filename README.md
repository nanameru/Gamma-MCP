# Gamma MCP

The Universal MCP Server exposes tools for the Gamma Generations API and is designed for prompt-first workflows in MCP-compatible clients.

## Installation

### Prerequisites
- Node.js 18+
- Set `UNIVERSAL_MCP_SERVER_GAMMA_API_KEY` in your environment

### Get a Gamma API key
- See Gamma developer docs and request access
  - Overview: https://developers.gamma.app/docs/how-does-the-generations-api-work
  - Access: https://developers.gamma.app/docs/get-access
  - Getting Started: https://developers.gamma.app/docs/getting-started

### Build locally
```bash
cd /Users/kimurataiyou/gamma-mcp
npm i
npm run build
```

## Setup: Claude Code (CLI)
Use this one-line command (replace with your real API key):
```bash
claude mcp add Gamma-MCP -s user -e GAMMA_MCP_GAMMA_API_KEY="sk-your-real-key" -- npx gamma-mcp
```
To remove the server from Claude Code:
```bash
claude mcp remove Gamma-MCP
```

## Setup: Cursor
Create `.cursor/mcp.json` at your repository root:
```json
{
  "mcpServers": {
    "gamma-mcp": {
      "command": "npx",
      "args": ["gamma-mcp"],
      "env": { "GAMMA_MCP_GAMMA_API_KEY": "sk-your-real-key" },
      "autoStart": true
    }
  }
}
```

## Other Clients and Agents

<details>
<summary>VS Code</summary>

[Install in VS Code](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22gamma-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22gamma-mcp%22%5D%7D)  
[Install in VS Code Insiders](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22gamma-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22gamma-mcp%22%5D%7D)

Or add via CLI:
```bash
code --add-mcp '{"name":"gamma-mcp","command":"npx","args":["gamma-mcp"],"env":{"GAMMA_MCP_GAMMA_API_KEY":"sk-your-real-key"}}'
```
</details>

<details>
<summary>Claude Desktop</summary>

Follow the MCP install guide and use the standard config above:
- Guide: https://modelcontextprotocol.io/quickstart/user
</details>

<details>
<summary>LM Studio</summary>

Add MCP Server with:
- Command: npx
- Args: ["gamma-mcp"]
- Env: GAMMA_MCP_GAMMA_API_KEY=sk-your-real-key
</details>

<details>
<summary>Goose</summary>

Advanced settings → Extensions → Add custom extension:
- Type: STDIO
- Command: npx
- Args: gamma-mcp
- Enabled: true
</details>

<details>
<summary>opencode</summary>

Example `~/.config/opencode/opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "gamma-mcp": {
      "type": "local",
      "command": [
        "npx",
        "gamma-mcp"
      ],
      "enabled": true
    }
  }
}
```
</details>

<details>
<summary>Qodo Gen</summary>

Open Qodo Gen (VSCode/IntelliJ) → Connect more tools → + Add new MCP → Paste the standard config JSON → Save.
</details>

<details>
<summary>Windsurf</summary>

Follow Windsurf MCP documentation and use the standard config above:
- Docs: https://docs.windsurf.com/windsurf/cascade/mcp
</details>

## Configuration (Env)
- GAMMA_MCP_GAMMA_API_KEY: Your Gamma API key (required)
- GAMMA_MCP_GAMMA_BASE_URL: Base URL override (default: `https://generations.gamma.app`)
- GAMMA_API_KEY / GAMMA_BASE_URL: Legacy fallbacks
- MCP_NAME: Server name override (default: `gamma-mcp`)

## Available Tools
- gamma_create_generation
  - inputs:
    - prompt?: string
    - templateId?: string
    - brandId?: string
    - format?: string
    - metadata?: object
    - callbacks?: object (webhook config)
    - payload?: object (structured creation payload)
- gamma_get_generation
  - inputs:
    - generationId: string
    - expand?: boolean
- gamma_list_generations
  - inputs:
    - status?: string (queued|processing|ready|failed)
    - limit?: number
    - page?: number
- gamma_get_asset
  - inputs:
    - generationId: string
    - assetId: string

### Example invocation (MCP tool call)
```json
{
  "name": "gamma_create_generation",
  "arguments": {
    "prompt": "Create a 10-slide pitch deck about product-market fit",
    "format": "presentation"
  }
}
```

## Troubleshooting
- 401 auth errors: verify `UNIVERSAL_MCP_SERVER_GAMMA_API_KEY`
- Ensure Node 18+
- If running via npx locally: `npx universal-mcp-server` works after `npm run build`
- For local development: you can run `node build/index.js` directly

## References
- Gamma Generations API Overview: https://developers.gamma.app/docs/how-does-the-generations-api-work
- Gamma Access: https://developers.gamma.app/docs/get-access
- Gamma Getting Started: https://developers.gamma.app/docs/getting-started
- Model Context Protocol Quickstart: https://modelcontextprotocol.io/quickstart/server
- MCP SDK Docs: https://modelcontextprotocol.io/docs/sdk
- MCP Architecture: https://modelcontextprotocol.io/docs/learn/architecture

## Name Consistency & Troubleshooting
- Always use CANONICAL_ID (`gamma-mcp`) for identifiers and configuration keys.
- Use CANONICAL_DISPLAY (`Gamma MCP`) only for UI labels or documentation prose.
- Do not mix legacy names once you have added the server to a client registry.

Consistency Matrix:
- npm package name → `gamma-mcp`
- Binary name → `gamma-mcp`
- MCP server name (SDK metadata) → `gamma-mcp`
- Env default `MCP_NAME` → `gamma-mcp`
- Client registry key → `gamma-mcp`
- UI label → `Gamma MCP`

Conflict Cleanup:
- Remove any stale entries such as `"UniversalServer"` and re-register with `"gamma-mcp"`.
- Ensure global `.mcp.json` or client registries only contain the canonical identifier.
- Cursor: configure keys in the UI; this project intentionally omits `.cursor/mcp.json`.

Example:
- Correct: `"mcpServers": { "gamma-mcp": { "command": "npx", "args": ["gamma-mcp"] } }`
- Incorrect: `"UniversalServer"` as the key (conflicts with `"gamma-mcp"`).

