import { generateText, tool } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";

const SearchGoogle = tool({
  description: "Get real-time results based on the provided query.",
  parameters: z.object({
    query: z.string().describe("Search query to find the article."),
  }),
  execute: async ({ query }) => {
    const result = await generateText({
      model: google("gemini-2.0-flash-001", { useSearchGrounding: true }),
      system: `Find an article/news based on the following query and provide its details.`,
      prompt: `${query}`,
    });

    return {
      text: result.text,
    };
  },
});

export { SearchGoogle };

// const Schema = z.object({
//   title: z.string().describe("The title of the article."),
//   link: z.string().url().describe("The URL link to the article."),
//   description: z.string().describe("A brief description of the article."),
//   content: z.string().describe("The full content of the article."),
//   imageUrl: z
//     .string()
//     .url()
//     .optional()
//     .describe("The URL of the article's image."),
//   date: z.string().describe("The publication date of the article."),
//   author: z.string().describe("The author of the article."),
//   publisher: z.string().describe("The publisher of the article."),
// });

// const { object } = await generateObject({
//     model: google("gemini-2.0-flash-001", { useSearchGrounding: true }),
//     prompt: `Find an article/news based on the following query and provide its details: "${query}"`,
//     schema: Schema,
//   });
