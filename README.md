# Universal MCP Server

## Features
- Exposes the full Gamma Generations API as Model Context Protocol tools.
- Ships as an npm-ready package with a binary named `universal-mcp-server`.
- Uses Node 18+ native `fetch` with optional `.env` support via `dotenv`.
- Provides binary-safe asset downloads and JSON schema for every tool input.
- Designed for local development, CI automation, or MCP client integration.

## Requirements
- Node.js 18 or newer.
- A Gamma Generations API key with project access (see Gamma docs).
- Optional: npm or pnpm for installation.

## Install & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the TypeScript sources:
   ```bash
   npm run build
   ```
3. Provide configuration (for example in `.env`):
   ```env
   UNIVERSAL_MCP_SERVER_GAMMA_API_KEY=sk_example
   UNIVERSAL_MCP_SERVER_GAMMA_BASE_URL=https://generations.gamma.app
   ```
4. Run via npx/CLI:
   ```bash
   npx universal-mcp-server
   ```

## Client Examples
- **Cursor / Other MCP-aware IDEs**: Configure a server entry with key `universal-mcp-server` and command `npx universal-mcp-server`.
- **Direct STDIO**: Start the binary and connect using the MCP handshake over stdin/stdout.
- **Custom Integrations**: Import the package after publishing and spawn the binary with the necessary environment variables.

## Build
- `npm run build` compiles TypeScript to `build/`.
- `npm pack --dry-run` previews the published tarball.
- Include the `build/` directory when packaging or deploying.

## Publish
1. Update the version in `package.json`.
2. Ensure `npm run build` succeeds and outputs the latest artifacts.
3. Publish:
   ```bash
   npm publish --access public
   ```
4. Tag the release in git if desired.

## Tools
- `gamma_create_generation`: Create a new Gamma deck from prompt, template, or structured payload.
- `gamma_get_generation`: Read generation status, metadata, and assets.
- `gamma_list_generations`: Enumerate recent generations with optional filters.
- `gamma_get_asset`: Download a binary asset (PDF, image, etc.) associated with a generation.

Environment variables:
- `UNIVERSAL_MCP_SERVER_GAMMA_API_KEY` (required): Bearer token for Gamma Generations API.
- `UNIVERSAL_MCP_SERVER_GAMMA_BASE_URL` (optional): Override the base URL (defaults to `https://generations.gamma.app`).
- `GAMMA_API_KEY` / `GAMMA_BASE_URL` (optional): Legacy fallbacks if the namespaced variables are not set.
- `MCP_NAME` (optional): Override the server name exposed to clients (defaults to `universal-mcp-server`).

## References
- Gamma Generations API Overview: https://developers.gamma.app/docs/how-does-the-generations-api-work
- Gamma Access: https://developers.gamma.app/docs/get-access
- Gamma Getting Started: https://developers.gamma.app/docs/getting-started
- MCP SDK Docs: https://modelcontextprotocol.io/docs/sdks
- MCP Architecture: https://modelcontextprotocol.io/docs/learn/architecture
- MCP Server Spec: https://modelcontextprotocol.io/specification/2025-06-18/server/index

## Name Consistency & Troubleshooting
- Always use CANONICAL_ID (`universal-mcp-server`) for identifiers and configuration keys.
- Use CANONICAL_DISPLAY (`Universal MCP Server`) only for UI labels or documentation prose.
- Do not mix legacy names once you have added the server to a client registry.

Consistency Matrix:
- npm package name → `universal-mcp-server`
- Binary name → `universal-mcp-server`
- MCP server name (SDK metadata) → `universal-mcp-server`
- Env default `MCP_NAME` → `universal-mcp-server`
- Client registry key → `universal-mcp-server`
- UI label → `Universal MCP Server`

Conflict Cleanup:
- Remove any stale entries such as `"UniversalServer"` and re-register with `"universal-mcp-server"`.
- Ensure global `.mcp.json` or client registries only contain the canonical identifier.
- Cursor: configure keys in the UI; this project intentionally omits `.cursor/mcp.json`.

Example:
- Correct: `"mcpServers": { "universal-mcp-server": { "command": "npx", "args": ["universal-mcp-server"] } }`
- Incorrect: `"UniversalServer"` as the key (conflicts with `"universal-mcp-server"`).

