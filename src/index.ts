#!/usr/bin/env node
import "dotenv/config";
import { Buffer } from "node:buffer";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CANONICAL_ID = "gamma-mcp";
const CANONICAL_DISPLAY = "Gamma MCP";
const CANONICAL_CONST = "GAMMA_MCP";
const DEFAULT_BASE_URL = "https://public-api.gamma.app";

type GammaRequestOptions = {
  path: string;
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  responseType?: "json" | "binary";
};

// Zod-based schemas are used by the MCP SDK; local JSON schema types are not required.

function getBaseUrl(): string {
  const namespaced = process.env[`${CANONICAL_CONST}_GAMMA_BASE_URL`]?.trim();
  const fallback = process.env.GAMMA_BASE_URL?.trim();
  return namespaced || fallback || DEFAULT_BASE_URL;
}

function getApiKey(): string {
  const namespaced = process.env[`${CANONICAL_CONST}_GAMMA_API_KEY`]?.trim();
  const fallback = process.env.GAMMA_API_KEY?.trim();
  const value = namespaced || fallback;
  if (!value) {
    throw new Error(
      `${CANONICAL_DISPLAY} requires the ${CANONICAL_CONST}_GAMMA_API_KEY environment variable to be set.`
    );
  }
  return value;
}

async function callGamma<T>(options: GammaRequestOptions): Promise<T> {
  const url = new URL(options.path, getBaseUrl());
  if (options.searchParams) {
    for (const [key, raw] of Object.entries(options.searchParams)) {
      if (raw === undefined) continue;
      url.searchParams.set(key, String(raw));
    }
  }

  const headers: Record<string, string> = {
    "X-API-KEY": getApiKey(),
    Accept: "application/json",
  };

  if (options.responseType === "binary") {
    headers.Accept = "*/*";
  }

  const method = options.method ?? (options.body ? "POST" : "GET");
  const init: RequestInit = { method, headers };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    const detail = await safeReadJson(response);
    throw new Error(
      `Gamma API request failed: ${response.status} ${response.statusText}` +
        (detail ? ` - ${JSON.stringify(detail)}` : "")
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (options.responseType === "binary") {
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer as unknown as T;
  }

  return (await response.json()) as T;
}

async function safeReadJson(response: Response): Promise<unknown | undefined> {
  try {
    return await response.json();
  } catch (error) {
    console.warn("Failed to parse Gamma API error payload", error);
    return undefined;
  }
}

const mcp = new McpServer({
  name: process.env.MCP_NAME ?? CANONICAL_ID,
  version: "0.1.0",
  description: `${CANONICAL_DISPLAY} exposes tools for the Gamma Generations API.`,
});

mcp.registerTool(
  "gamma_create_generation",
  {
    description:
      "Create a new Gamma deck generation from a prompt, template, or structured payload.",
    inputSchema: {
      inputText: z.string().describe(
        "The text used to generate the Gamma content. Character limit is 1-750,000. It can be a short prompt or lengthy, structured text."
      ).optional(),
      textMode: z
        .enum(["generate", "condense", "preserve"])
        .describe("Determines how inputText is modified: generate (default), condense, or preserve.")
        .optional(),
      format: z
        .enum(["presentation", "document", "social"])
        .describe("Requested output format: presentation (default), document, or social.")
        .optional(),
      themeName: z
        .string()
        .describe("Defines the theme for the output (colors, fonts).")
        .optional(),
      numCards: z
        .number()
        .describe("Number of cards to create if cardSplit is auto. Pro users: 1-50, Ultra users: 1-75.")
        .optional(),
      cardSplit: z
        .enum(["auto", "inputTextBreaks"])
        .describe("Controls how content is divided into cards: auto (default) or inputTextBreaks.")
        .optional(),
      additionalInstructions: z
        .string()
        .describe("Additional specifications for content, layouts, etc. Character limit is 1-500.")
        .optional(),
      exportAs: z
        .enum(["pdf", "pptx"])
        .describe("Allows direct export of the generated Gamma as pdf or pptx.")
        .optional(),
      textOptions: z
        .object({
          amount: z.enum(["brief", "medium", "detailed", "extensive"]).optional(),
          tone: z.string().optional(),
          audience: z.string().optional(),
          language: z.string().optional(),
        })
        .describe("Text generation options.")
        .optional(),
      imageOptions: z
        .object({
          source: z.enum(["aiGenerated", "pictographic", "unsplash", "giphy", "webAllImages", "webFreeToUse", "webFreeToUseCommercially", "placeholder", "noImages"]).optional(),
          model: z.string().optional(),
          style: z.string().optional(),
        })
        .describe("Image generation options.")
        .optional(),
      cardOptions: z
        .object({
          dimensions: z.string().optional(),
        })
        .describe("Card layout options.")
        .optional(),
      sharingOptions: z
        .object({
          workspaceAccess: z.enum(["noAccess", "view", "comment", "edit", "fullAccess"]).optional(),
          externalAccess: z.enum(["noAccess", "view", "comment", "edit"]).optional(),
        })
        .describe("Sharing access options.")
        .optional(),
    },
  },
  async ({
    inputText,
    textMode,
    format,
    themeName,
    numCards,
    cardSplit,
    additionalInstructions,
    exportAs,
    textOptions,
    imageOptions,
    cardOptions,
    sharingOptions,
  }) => {
    if (!inputText) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "inputText must be provided to create a Gamma generation.",
          },
        ],
      };
    }

    // Normalize language codes to avoid Gamma API validation errors
    const normalizedTextOptions = (() => {
      if (!textOptions) return undefined;
      const clone: typeof textOptions = { ...textOptions };
      if (clone.language) {
        const raw = String(clone.language).trim().toLowerCase();
        // Common aliases for Japanese → "ja"
        const japaneseAliases = new Set([
          "ja",
          "jp",
          "ja-jp",
          "japanese",
          "日本語",
        ]);
        if (japaneseAliases.has(raw)) {
          clone.language = "ja";
        }
      }
      return clone;
    })();

    const response = await callGamma<Record<string, unknown>>({
      path: "/v0.2/generations",
      method: "POST",
      body: {
        inputText,
        textMode,
        format,
        themeName,
        numCards,
        cardSplit,
        additionalInstructions,
        exportAs,
        textOptions: normalizedTextOptions,
        imageOptions,
        cardOptions,
        sharingOptions,
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
  }
);

mcp.registerTool(
  "gamma_get_generation",
  {
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
  },
  async ({ generationId, expand }) => {
    const response = await callGamma<Record<string, unknown>>({
      path: `/v0.2/generations/${encodeURIComponent(generationId)}`,
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
  }
);

mcp.registerTool(
  "gamma_list_generations",
  {
    description: "List recent Gamma generations with optional status filtering.",
    inputSchema: {
      status: z
        .string()
        .describe(
          "Optional filter for generation status (queued, processing, ready, failed)."
        )
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
  },
  async ({ status, limit, page }) => {
    const response = await callGamma<Record<string, unknown>>({
      path: "/v0.2/generations",
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
  }
);

mcp.registerTool(
  "gamma_get_asset",
  {
    description:
      "Download an asset (such as a PDF or image) associated with a completed Gamma generation.",
    inputSchema: {
      generationId: z
        .string()
        .describe("Identifier of the generation that produced the asset."),
      assetId: z
        .string()
        .describe(
          "Asset identifier obtained from the generation detail payload."
        ),
    },
  },
  async ({ generationId, assetId }) => {
    const binary = await callGamma<Buffer>({
      path: `/v0.2/generations/${encodeURIComponent(
        generationId
      )}/assets/${encodeURIComponent(assetId)}`,
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
  }
);

await mcp.connect(new StdioServerTransport());
