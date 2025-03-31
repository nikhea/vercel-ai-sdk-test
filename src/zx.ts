import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { string, z } from "zod";
import { tavily } from "@tavily/core";

interface SearchResponse {
  results: { title: string; link: string; snippet: string }[];
}

const tavilySearchTool = tool({
  description:
    "Performs a search using the Tavily API and returns the results.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    if (!process.env.TAVILY_API_KEY) {
      return;
    }
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    const response = await tvly.search(query, {
      includeImages: true,
      includeAnswer: true,
      // includeDomains,
      includeImageDescriptions: true,
      includeRawContent: true,
      include_images: true,
    });
    // console.log({ res: response.results[0] });

    const results = response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      rawContent: result.rawContent,
      images: result.images || [], // Include images if available
      publishedDate: result.publishedDate,
    }));

    return results;
  },
});

const prompt = "nysc trending";

const result = await generateText({
  model: google("gemini-2.0-flash-001"),
  prompt,
  tools: { tavilySearch: tavilySearchTool },
  maxSteps: 5,
  onStepFinish: ({ text, toolCalls, toolResults }) => {
    console.log("Step text:", text);
    console.log("Tool calls:", toolCalls);
    console.log("Tool results:", toolResults);
  },
});
console.log("Final result:", result.text);
