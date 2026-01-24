import { tool } from "ai";
import { z } from "zod";

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

interface ExaSearchResponse {
  requestId: string;
  results: ExaSearchResult[];
}

export const webSearchTool = tool({
  description:
    "Search the web for current information. Use this when you need to find up-to-date information, news, research, or any topic not covered in the meeting transcript.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to find relevant information on the web"),
    numResults: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Number of results to return (1-10)"),
    category: z
      .enum([
        "general",
        "news",
        "research paper",
        "github",
        "company",
        "tweet",
      ])
      .optional()
      .describe("Category to focus the search on"),
  }),
  execute: async ({ query, numResults = 5, category }) => {
    const apiKey = process.env.EXA_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "EXA_API_KEY is not configured",
        results: [],
      };
    }

    try {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query,
          type: "auto",
          numResults,
          ...(category && category !== "general" && { category }),
          contents: {
            text: {
              maxCharacters: 1000,
            },
            highlights: {
              numSentences: 2,
              highlightsPerUrl: 2,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Exa API error: ${response.status} - ${errorText}`,
          results: [],
        };
      }

      const data: ExaSearchResponse = await response.json();

      const results = data.results.map((result) => ({
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
        author: result.author,
        snippet:
          result.highlights?.join(" ") ||
          result.text?.slice(0, 500) ||
          "No content available",
      }));

      return {
        success: true,
        query,
        count: results.length,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results: [],
      };
    }
  },
});
