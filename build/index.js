import "dotenv/config";
import { Buffer } from "node:buffer";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const CANONICAL_ID = "universal-mcp-server";
const CANONICAL_DISPLAY = "Universal MCP Server";
const CANONICAL_CONST = "UNIVERSAL_MCP_SERVER";
const DEFAULT_BASE_URL = "https://generations.gamma.app";
// Zod-based schemas are used by the MCP SDK; local JSON schema types are not required.
function getBaseUrl() {
    const namespaced = process.env[`${CANONICAL_CONST}_GAMMA_BASE_URL`]?.trim();
    const fallback = process.env.GAMMA_BASE_URL?.trim();
    return namespaced || fallback || DEFAULT_BASE_URL;
}
function getApiKey() {
    const namespaced = process.env[`${CANONICAL_CONST}_GAMMA_API_KEY`]?.trim();
    const fallback = process.env.GAMMA_API_KEY?.trim();
    const value = namespaced || fallback;
    if (!value) {
        throw new Error(`${CANONICAL_DISPLAY} requires the ${CANONICAL_CONST}_GAMMA_API_KEY environment variable to be set.`);
    }
    return value;
}
async function callGamma(options) {
    const url = new URL(options.path, getBaseUrl());
    if (options.searchParams) {
        for (const [key, raw] of Object.entries(options.searchParams)) {
            if (raw === undefined)
                continue;
            url.searchParams.set(key, String(raw));
        }
    }
    const headers = {
        Authorization: `Bearer ${getApiKey()}`,
        Accept: "application/json",
    };
    if (options.responseType === "binary") {
        headers.Accept = "*/*";
    }
    const method = options.method ?? (options.body ? "POST" : "GET");
    const init = { method, headers };
    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, init);
    if (!response.ok) {
        const detail = await safeReadJson(response);
        throw new Error(`Gamma API request failed: ${response.status} ${response.statusText}` +
            (detail ? ` - ${JSON.stringify(detail)}` : ""));
    }
    if (response.status === 204) {
        return undefined;
    }
    if (options.responseType === "binary") {
        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer;
    }
    return (await response.json());
}
async function safeReadJson(response) {
    try {
        return await response.json();
    }
    catch (error) {
        console.warn("Failed to parse Gamma API error payload", error);
        return undefined;
    }
}
const mcp = new McpServer({
    name: process.env.MCP_NAME ?? CANONICAL_ID,
    version: "0.1.0",
    description: `${CANONICAL_DISPLAY} exposes tools for the Gamma Generations API.`,
});
mcp.registerTool("gamma_create_generation", {
    description: "Create a new Gamma deck generation from a prompt, template, or structured payload.",
    inputSchema: {
        prompt: z.string().describe("Natural language instructions or prompt used to generate the deck.").optional(),
        templateId: z
            .string()
            .describe("Optional Gamma template identifier to base the deck on.")
            .optional(),
        brandId: z
            .string()
            .describe("Optional brand identifier to apply brand styles.")
            .optional(),
        format: z
            .string()
            .describe("Requested output format (e.g. presentation, doc).")
            .optional(),
        metadata: z
            .record(z.unknown())
            .describe("Additional metadata forwarded to the Gamma API.")
            .optional(),
        callbacks: z
            .record(z.unknown())
            .describe("Webhook configuration for async completions as defined by Gamma.")
            .optional(),
        payload: z
            .record(z.unknown())
            .describe("When supplying a structured creation payload, pass it via this field instead of prompt.")
            .optional(),
    },
}, async ({ prompt, templateId, brandId, format, metadata, callbacks, payload, }) => {
    if (!prompt && !payload) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: "Either 'prompt' or 'payload' must be provided to create a Gamma generation.",
                },
            ],
        };
    }
    const response = await callGamma({
        path: "/v1/generations",
        method: "POST",
        body: {
            prompt,
            template_id: templateId,
            brand_id: brandId,
            format,
            metadata,
            callbacks,
            payload,
        },
    });
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(response),
            },
        ],
    };
});
mcp.registerTool("gamma_get_generation", {
    description: "Retrieve the current state of a Gamma generation by identifier.",
    inputSchema: {
        generationId: z
            .string()
            .describe("Identifier returned when the generation was created."),
        expand: z
            .boolean()
            .describe("Include rendered assets and slides when available.")
            .optional(),
    },
}, async ({ generationId, expand }) => {
    const response = await callGamma({
        path: `/v1/generations/${encodeURIComponent(generationId)}`,
        method: "GET",
        searchParams: {
            expand: expand ? "true" : undefined,
        },
    });
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(response),
            },
        ],
    };
});
mcp.registerTool("gamma_list_generations", {
    description: "List recent Gamma generations with optional status filtering.",
    inputSchema: {
        status: z
            .string()
            .describe("Optional filter for generation status (queued, processing, ready, failed).")
            .optional(),
        limit: z
            .number()
            .describe("Maximum number of generations to return (default 20).")
            .optional(),
        page: z
            .number()
            .describe("Pagination cursor/page number when supported.")
            .optional(),
    },
}, async ({ status, limit, page }) => {
    const response = await callGamma({
        path: "/v1/generations",
        method: "GET",
        searchParams: {
            status,
            limit,
            page,
        },
    });
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(response),
            },
        ],
    };
});
mcp.registerTool("gamma_get_asset", {
    description: "Download an asset (such as a PDF or image) associated with a completed Gamma generation.",
    inputSchema: {
        generationId: z
            .string()
            .describe("Identifier of the generation that produced the asset."),
        assetId: z
            .string()
            .describe("Asset identifier obtained from the generation detail payload."),
    },
}, async ({ generationId, assetId }) => {
    const binary = await callGamma({
        path: `/v1/generations/${encodeURIComponent(generationId)}/assets/${encodeURIComponent(assetId)}`,
        method: "GET",
        responseType: "binary",
    });
    return {
        content: [
            {
                type: "text",
                text: binary.toString("base64"),
            },
        ],
    };
});
await mcp.connect(new StdioServerTransport());
//# sourceMappingURL=index.js.map